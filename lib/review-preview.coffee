url = require 'url'

ReVIEWPreviewView = require './review-preview-view'

module.exports =
  configDefaults:
    grammars: [
      'source.review'
    ]

  activate: ->
    atom.workspaceView.command 'review-preview:toggle', =>
      @toggle()

    atom.workspace.registerOpener (uriToOpen) ->
      console.log(uriToOpen);
      {protocol, host, pathname} = url.parse(uriToOpen)
      pathname = decodeURI(pathname) if pathname
      return unless protocol is 'review-preview:'

      if host is 'editor'
        new ReVIEWPreviewView(editorId: pathname.substring(1))
      else
        new ReVIEWPreviewView(filePath: pathname)

  toggle: ->
    console.log("toggle!")
    editor = atom.workspace.getActiveEditor()
    return unless editor?

    grammars = atom.config.get('language-review.grammars') ? []
    console.log(editor.getGrammar().scopeName)
    console.log(grammars)
    return unless editor.getGrammar().scopeName in grammars

    uri = "review-preview://editor/#{editor.id}"

    previewPane = atom.workspace.paneForUri(uri)
    if previewPane
      previewPane.destroyItem(previewPane.itemForUri(uri))
      return

    previousActivePane = atom.workspace.getActivePane()
    atom.workspace.open(uri, split: 'right', searchAllPanes: true).done (previewView) ->
      if previewView instanceof ReVIEWPreviewView
        previewView.renderReVIEW()
        previousActivePane.activate()
