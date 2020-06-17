const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/webexplorer/" : "/",
  indexPath: "site.html",
  configureWebpack: {
    plugins: [new MonacoWebpackPlugin()]
  }
};
