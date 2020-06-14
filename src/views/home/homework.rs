use crate::{Model, Msg};

use seed::{prelude::*, *};

pub fn element_devoirs(model: &Model) -> Node<Msg> {
    //<li class=\"title\">Devoirs</li>
    ul![
        C!["devoirs"],
        li![C!["title","unselectable"], "Devoirs"],
        model.data.as_ref().unwrap().homework.iter().flat_map(|x| x.generate()).collect::<Vec<Node<Msg>>>()
    ]
}