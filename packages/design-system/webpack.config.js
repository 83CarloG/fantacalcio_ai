"use strict";
const path = require("node:path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = {
    entry: {index: [path.resolve(__dirname, "src/index.js"), path.resolve(__dirname, "src/index.css")]},
    output: {path: path.resolve(__dirname, "dist"), filename: "index.js", clean: true},
    module: {rules: [
        {test: /\.css$/, use: [MiniCssExtractPlugin.loader, "css-loader"]},
        // component templates are static Shadow DOM markup with zero {{ }} interpolation —
        // they need the raw file text, not a compiled Handlebars template function, so
        // `require("./template.handlebars")` must resolve to a plain string.
        {test: /\.handlebars$/, type: "asset/source"},
        {test: /\.svg$/, type: "asset/resource"}
    ]},
    plugins: [new MiniCssExtractPlugin({filename: "index.css"})]
};
