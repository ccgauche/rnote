use crate::{Model, Msg};

use seed::{prelude::*, *};

pub fn element_connect(model: &Model) -> Node<Msg> {
    /*
    <div class="login">
        <div class="form">
            <h2>Connection</h2>
            <label>Nom d'utilisateur</label>
            <input type="text" name="username" id="username">
            <label>Mot de passe</label>
            <input type="password" name="password" id="password">
            <div class="field">
                <input type="checkbox" id="scales" name="scales"
                        checked>
                <label for="scales">Rester connecté</label>
            </div>
            <button>Se connecter</button>
        </div>
    </div>
    */
    div![
        C!["login"],
        div![
            C!["form"],
            h2!["Connexion"],
            label!["Nom d'utilisateur"],
            input![
                attrs! {At::Type => "text",At::Name => "username",At::Value => model.login},
                input_ev(Ev::Input, Msg::UpdateLogin)
            ],
            label!["Mot de passe"],
            input![
                attrs! {At::Type => "password",At::Name => "password",At::Value => model.password},
                input_ev(Ev::Input, Msg::UpdatePassword)
            ],
            div![
                C!["field"],
                input![attrs! {At::Type => "checkbox",At::Name => "keep_connected"}],
                label!["Rester connecté"]
            ],
            button!["Se connecter", simple_ev(Ev::Click, Msg::Connect)]
        ]
    ]
}
