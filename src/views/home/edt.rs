use crate::{Model, Msg};

use seed::{prelude::*, *};

pub fn element_edt(model: &Model) -> Node<Msg> {
    let data = model.data.as_ref().unwrap();
    let edt = data.build_edt();
    let mut previous = 8;
    let mut hours: Vec<Node<Msg>> = Vec::new();
    for hour in edt {
        for ix in previous..hour.hour {
            hours.push(li![
                C!["empty"],
                a![
                    C!["timer", "timer-left"],
                    crate::data::HOURS.get(&ix).unwrap()
                ]
            ])
        }
        hours.push(hour.generate());
        previous = hour.hour + hour.length;
    }
    for ix in previous..17 {
        hours.push(li![
            C!["empty"],
            a![
                C!["timer", "timer-left"],
                crate::data::HOURS.get(&ix).unwrap()
            ]
        ])
    }
    //edt.iter().map(|x|)
    ul![
        C!["edt"],
        li![
            C!["title", "edt-title"],
            div![
                C!["row"],
                a![
                    C!["icon", "previous","unselectable"],
                    "◄",
                    simple_ev(Ev::Click, Msg::PreviousDay)
                ],
                a![C!["unselectable"],"Emploi du temps"],
                a![C!["icon", "next","unselectable"], "►", simple_ev(Ev::Click, Msg::NextDay)]
            ],
            div![
                C!["row", "date"],
                a![format!(
                    "{} {} {}",
                    crate::data::DAYS.get(&data.day_of_week).unwrap(),
                    data.day,
                    crate::data::MONTHS.get(data.month as usize).unwrap()
                )]
            ]
        ],
        hours
    ]
}
