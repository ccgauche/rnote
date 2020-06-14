use crate::{Model, Msg};

use seed::{prelude::*, *};

pub fn element_connexion(model: &Model) -> Node<Msg> {
    div![
        C!["loader","unselectable"],
        div![
            div![C!["lds-dual-ring"]]
        ],
        a!["Connexion"]
    ]
}
