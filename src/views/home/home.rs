use crate::{Model, Msg};

use seed::{prelude::*, *};

pub fn element_home(model: &Model) -> Vec<Node<Msg>> {
    nodes![
        ul![C!["nav"], li!["Home"], li!["Settings"]],
        div![C!["container"], super::element_edt(&model),super::element_devoirs(&model)]
    ]
}