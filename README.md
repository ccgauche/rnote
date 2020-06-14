# RNote

> A pronote font-end for a simple and fast pronote.

This project is open-source and can't be used for commercial purposes.

Simple Pronote Interface in Rust

## 2. Install / check required tools

1. Make sure you have basic tools installed:

   - [Rust](https://www.rust-lang.org) 
     - Check: `$ rustc -V` => `rustc 1.43.1 (8d69840ab 2020-05-04)`
     - Install: https://www.rust-lang.org/tools/install
   - [cargo-make](https://sagiegurari.github.io/cargo-make/)
     - Check: `$ cargo make -V` => `cargo-make 0.30.7`
     - Install: `$ cargo install cargo-make`
   - [nodeJS](https://sagiegurari.github.io/cargo-make/)
     - Check: `$ node` should open a console
     - Install: `https://nodejs.org/`
       
1. Platform-specific tools like `ssl` and `pkg-config`:
    - Follow recommendations in build errors (during the next chapter).
    - _Note_: Don't hesitate to write notes or a tutorial for your platform and create a PR .

## 3. Prepare your project for work

1. Open the project in your favorite IDE (I recommend [VS Code](https://code.visualstudio.com/) + [Rust Anaylzer](https://rust-analyzer.github.io/)).
2. Open a new terminal tab / window and run: `cargo make serve`
3. Open a second terminal tab and run: `cargo make watch`
4. Open the API server in node.
  1. Go in the `pronote-api` folder
  2. Open a terminal
  3. Run `$ npm init` if you never ran before this server (This install dependencies)
  4. Run `$ node .` to run the server
5. If you see errors, or a new feature: Do a github issue or fork the project

## 5. Prepare your project for deploy

1. Run `cargo make verify` in your terminal to format and lint the code.
2. Run `cargo make build_release`.
3. Upload `index.html` and `pkg` into your server's public folder.
   - Don't forget to upload also configuration files for your hosting, see the [Netlify](https://www.netlify.com/) one below.

```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```