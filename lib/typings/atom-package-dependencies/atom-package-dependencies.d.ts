declare module "atom-package-dependencies" {
    function require(packageName: string): any;
    function install(callback?: () => void): void;
}
