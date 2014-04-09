path = require 'path'
{$, $$$, EditorView, ScrollView} = require 'atom'
_ = require 'underscore-plus'
{File} = require 'pathwatcher'

ReVIEW = require "review.js"

module.exports =
class ReVIEWPreviewView extends ScrollView
  atom.deserializers.add(this)

  @deserialize: (state) ->
    new ReVIEWPreviewView(state)

  @content: ->
    @div class: 'review-preview native-key-bindings', tabindex: -1

  constructor: ({@editorId, filePath}) ->
    super

    if @editorId?
      @resolveEditor(@editorId)
    else
      @file = new File(filePath)
      @handleEvents()

  serialize: ->
    deserializer: 'ReVIEWPreviewView'
    filePath: @getPath()
    editorId: @editorId

  destroy: ->
    @unsubscribe()

  resolveEditor: (editorId) ->
    resolve = =>
      @editor = @editorForId(editorId)

      if @editor?
        @trigger 'title-changed' if @editor?
        @handleEvents()
      else
        # The editor this preview was created for has been closed so close
        # this preview since a preview cannot be rendered without an editor
        @parents('.pane').view()?.destroyItem(this)

    if atom.workspace?
      resolve()
    else
      atom.packages.once 'activated', =>
        resolve()
        @renderReVIEW()

  editorForId: (editorId) ->
    for editor in atom.workspace.getEditors()
      return editor if editor.id?.toString() is editorId.toString()
    null

  handleEvents: ->
    @subscribe atom.syntax, 'grammar-added grammar-updated', _.debounce((=> @renderReVIEW()), 250)
    @subscribe this, 'core:move-up', => @scrollUp()
    @subscribe this, 'core:move-down', => @scrollDown()

    @subscribeToCommand atom.workspaceView, 'review-preview:zoom-in', =>
      zoomLevel = parseFloat(@css('zoom')) or 1
      @css('zoom', zoomLevel + .1)

    @subscribeToCommand atom.workspaceView, 'review-preview:zoom-out', =>
      zoomLevel = parseFloat(@css('zoom')) or 1
      @css('zoom', zoomLevel - .1)

    @subscribeToCommand atom.workspaceView, 'review-preview:reset-zoom', =>
      @css('zoom', 1)

    changeHandler = =>
      @renderReVIEW()
      pane = atom.workspace.paneForUri(@getUri())
      if pane? and pane isnt atom.workspace.getActivePane()
        pane.activateItem(this)

    if @file?
      @subscribe(@file, 'contents-changed', changeHandler)
    else if @editor?
      @subscribe(@editor.getBuffer(), 'contents-modified', changeHandler)
      @subscribe @editor, 'path-changed', => @trigger 'title-changed'

  renderReVIEW: ->
    @showLoading()
    if @file?
      @file.read().then (contents) => @renderReVIEWText(contents)
    else if @editor?
      @renderReVIEWText(@editor.getText())

  renderReVIEWText: (text) ->
    console.log(text)
    roaster = require 'roaster'
    sanitize = true
    breaks = atom.config.get('review-preview.breakOnSingleNewline')

    files = {
      "ch01.re": text
    }
    result = {
    }
    ReVIEW.start (review) =>
      review.initConfig
        read: (path) => files[path]
        write: (path, content) => result[path] = content
        listener:
          onReports: (reports) => console.log(reports)
          onCompileSuccess: (book) =>
            book.parts[1].chapters[0].builderProcesses.forEach (process) =>
              @html(@tokenizeCodeBlocks(@resolveImagePaths(process.result)))
        builders: [new ReVIEW.Build.HtmlBuilder(false)]
        book:
          preface: []
          chapters: [
            "ch01.re"
          ]
          afterword: []
    null

  getTitle: ->
    if @file?
      "#{path.basename(@getPath())} Preview"
    else if @editor?
      "#{@editor.getTitle()} Preview"
    else
      "Re:VIEW Preview"

  getUri: ->
    if @file?
      "review-preview://#{@getPath()}"
    else
      "review-preview://editor/#{@editorId}"

  getPath: ->
    if @file?
      @file.getPath()
    else if @editor?
      @editor.getPath()

  showError: (result) ->
    failureMessage = result?.message

    @html $$$ ->
      @h2 'Previewing Re:VIEW Failed'
      @h3 failureMessage if failureMessage?

  showLoading: ->
    @html $$$ ->
      @div class: 'review-spinner', 'Loading Re:VIEW\u2026'

  resolveImagePaths: (html) =>
    html = $(html)
    imgList = html.find("img")

    for imgElement in imgList
      img = $(imgElement)
      src = img.attr('src')
      continue if src.match /^(https?:\/\/)/
      img.attr('src', path.resolve(path.dirname(@getPath()), src))

    html

  tokenizeCodeBlocks: (html) =>
    html = $(html)
    preList = $(html.filter("pre"))

    html
