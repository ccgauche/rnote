// (Lines like the one below ignore selected Clippy rules
//  - it's useful when you want to check your code with `cargo make verify`
// but some rules are too "annoying" or are not applicable for your case.)
#![allow(clippy::wildcard_imports)]

extern crate js_sys;
extern crate web_sys;

#[macro_use]
extern crate lazy_static;
extern crate serde;
extern crate serde_json;

use seed::{prelude::*, *};

pub mod config;
pub mod data;
pub mod views;
pub mod pronote_out;

use futures::Future;

// ------ ------
//     Init
// ------ ------

// `init` describes what should happen when your app started.
fn init(_: Url, _: &mut impl Orders<Msg>) -> Model {
    Model::default()
}

#[derive(Default)]
pub struct Model {
    pub login: String,
    pub password: String,
    pub data: Option<data::Data>,
    pub connexion: bool
}

#[derive(Clone)]
pub enum Msg {
    Connect,
    UpdateLogin(String),
    UpdatePassword(String),
    NextDay,
    PreviousDay,
    DataFetched(String),
}

fn update(msg: Msg, model: &mut Model, orders: &mut impl Orders<Msg>) {
    match msg {
        Msg::Connect => {
            model.connexion = true;
            //orders.skip(); // No need to rerender http://localhost:21727
            let request = Request::new("http://localhost:21727")
                .method(Method::Post)
                .text(format!(r#"{{
                    "type": "fetch",
                    "username": "{}",
                    "password": "{}",
                    "url": "https://0781839a.index-education.net/pronote/",
                    "cas": "iledefrance" ,
                    "typecon": "eleve.html"
                  }}"#,model.login,model.password));
            orders.perform_cmd(async {

                let response = fetch(request).await.expect("HTTP request failed");

                let user = response
                    .check_status() // ensure we've got 2xx status
                    .expect("status check failed")
                    .text()
                    .await
                    .expect("deserialization failed");

                Msg::DataFetched(user)
            });
        }
        Msg::DataFetched(data) => {
            log!("Data:",data);
            if !data.contains("\"error\": \"") {
                model.data = data::Data::from_str(&data);
            } else {
                model.data = None;
            }
            model.connexion = false;
            //model.data = Some(data::Data::new());
        }
        Msg::UpdateLogin(login) => {
            model.login = login;
        }
        Msg::UpdatePassword(password) => {
            model.password = password;
        }
        Msg::NextDay => {
            if let Some(e) = &mut model.data {
                e.next_day();
            }
        }
        Msg::PreviousDay => {
            if let Some(e) = &mut model.data {
                e.previous_day();
            }
        }
    }
}

fn view(model: &Model) -> Vec<Node<Msg>> {
    if model.connexion {
        return vec![views::element_connexion(&model)];
    }
    if let Some(data) = &model.data {
        views::element_home(&model)
    } else {
        vec![views::element_connect(&model)]
    }
}

use web_sys::HtmlElement;

#[wasm_bindgen(start)]
pub fn start() {
    let document = web_sys::window().expect("should have a window in this context").document().expect("window should have a document");
    document.get_element_by_id("loader")
        .expect("should have #loader on the page")
        .dyn_ref::<HtmlElement>()
        .expect("#loader should be an `HtmlElement`")
        .style()
        .set_property("display", "none").unwrap();
    document.get_element_by_id("app")
        .expect("should have #app on the page")
        .dyn_ref::<HtmlElement>()
        .expect("#app should be an `HtmlElement`")
        .style()
        .set_property("display", "flex").unwrap();
    // Mount the `app` to the element with the `id` "app".
    App::start("app", init, update, view);
}