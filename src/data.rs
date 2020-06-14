use std::collections::HashMap;

use seed::{prelude::*, *};

use crate::*;

use js_sys::*;

#[derive(Debug, PartialEq, Default, Clone)]
pub struct Data {
    pub edt: Vec<EdtHour>,
    pub homework: Vec<Homework>,
    pub day: u8,
    pub month: u8,
    pub day_of_week: u8,
    pub timestamp: f64,
}

impl Data {

    pub fn from_str(string: &str) -> Option<Self> {
        let out: crate::pronote_out::Output = serde_json::from_str(string).ok()?;
        let date = js_sys::Date::new_0();
        Some(Self {
            day: date.get_date() as u8,
            month: date.get_month() as u8,
            day_of_week: date.get_day() as u8,
            timestamp: js_sys::Date::now(),
            edt: out.get_hours().iter().map(|x| {
                let start_date = js_sys::Date::new(&JsValue::from_f64(x.from as f64));
                let i = (x.to - x.from) / 3600000;
                EdtHour {
                    hour: start_date.get_hours() as u8,
                    day: start_date.get_date() as u8,
                    month: start_date.get_month() as u8,
                    length: i as u8,
                    color: x.color.to_owned(),
                    subject: x.subject.to_owned(),
                    room: x.room.clone(),
                }
            }).collect(),
            homework: out.homeworks.iter().map(|x| {
                /*
            
                */
                let mut files = HashMap::with_capacity(x.files.len());
                for file in &x.files {
                    files.insert(file.name.to_owned(),file.url.to_owned());
                }
                let start_date = js_sys::Date::new(&JsValue::from_f64(x.until as f64));
                Homework {
                    day: start_date.get_date() as u8,
                    month: start_date.get_month() as u8,
                    color: "#F0F".to_owned(),
                    subject: x.subject.to_owned(),
                    description: x.content.to_owned(),
                    day_of_week: start_date.get_day() as u8,
                    files
                }
            }).collect()
        })
    }

    pub fn next_day(&mut self) {
        self.timestamp += 86400000.0;
        let date = js_sys::Date::new(&JsValue::from_f64(self.timestamp));
        self.day = date.get_date() as u8;
        self.month = date.get_month() as u8;
        self.day_of_week = date.get_day() as u8;
    }

    pub fn previous_day(&mut self) {
        self.timestamp -= 86400000.0;
        let date = js_sys::Date::new(&JsValue::from_f64(self.timestamp));
        self.day = date.get_date() as u8;
        self.month = date.get_month() as u8;
        self.day_of_week = date.get_day() as u8;
    }

    pub fn build_edt(&self) -> Vec<&EdtHour> {
        self.edt
            .iter()
            .filter(|x| x.day == self.day && x.month == self.month)
            .collect::<Vec<&EdtHour>>()
    }
}

#[derive(Debug, PartialEq, Default, Clone)]
pub struct Homework {
    pub day: u8,
    pub month: u8,
    pub day_of_week: u8,
    pub color: String,
    pub subject: String,
    pub description: String,
    pub files: HashMap<String, String>,
}

impl Homework {

    pub fn generate(&self) -> Option<Node<Msg>> {
        let date = js_sys::Date::new_0();
        let day = self.day as i32 - date.get_date() as i32 + (self.month as i32 - date.get_month() as i32) * 31;
        if day < 0 {
            return None;
        }
        Some(li![a![
            C!["title"],
            style! {"border-color" => crate::config::get_color(&self.subject,"#FF00FF")},
            crate::config::get_name(&self.subject),
            span![style! {"color" => "#FFF7", "margin-left" => "0.75rem"},if day == 0 {
                "Aujourd'hui".to_string()
            } else if day == 1 {
                "Demain".to_string()
            } else if day < 7{
                DAYS.get(&self.day_of_week).unwrap().to_string()
            } else {
                format!("{} / {}",self.day,self.month)
            }]
        ],a![C!["message"],&self.description],self.files.iter().map(|(x,y)| {
            a![C!["file"],attrs!{At::Href => y.to_string()},trim_file(x)]
        }).collect::<Vec<Node<Msg>>>()])
    }
}

const TRIM_SIZE: usize = 20;

fn trim_file(file: &str) -> String {
    if file.len() > TRIM_SIZE && file.contains(".") {
        let mut points: Vec<String> = file.split(".").map(|x| x.to_string()).collect();
        let last = points.pop().unwrap();
        let points = points.join(".");
        return format!("{}...{}",&points[0..points.len().min(TRIM_SIZE - last.len() - 1)],last);
    }
    file.to_owned()
}

#[derive(Debug, PartialEq, Default, Clone)]
pub struct EdtHour {
    pub hour: u8,
    pub day: u8,
    pub month: u8,
    pub length: u8,
    pub color: String,
    pub subject: String,
    pub room: Option<String>,
}

lazy_static! {
    pub static ref HOURS: HashMap<u8, String> = {
        let mut map: HashMap<u8, String> = HashMap::with_capacity(10);
        map.insert(8, "8h30".to_string());
        map.insert(9, "9h30".to_string());
        map.insert(10, "10h30".to_string());
        map.insert(11, "11h30".to_string());
        map.insert(12, "12h30".to_string());
        map.insert(13, "13h30".to_string());
        map.insert(14, "14h30".to_string());
        map.insert(15, "15h30".to_string());
        map.insert(16, "16h30".to_string());
        map.insert(17, "17h30".to_string());
        map
    };
    pub static ref DAYS: HashMap<u8, String> = {
        let mut map: HashMap<u8, String> = HashMap::with_capacity(8);
        map.insert(1, "Lundi".to_string());
        map.insert(2, "Mardi".to_string());
        map.insert(3, "Mercredi".to_string());
        map.insert(4, "Jeudi".to_string());
        map.insert(5, "Vendredi".to_string());
        map.insert(6, "Samedi".to_string());
        map.insert(7, "Dimanche".to_string());
        map.insert(0, "Dimanche".to_string());
        map
    };
    pub static ref MONTHS: Vec<String> = vec![
        "janvier".to_string(),
        "février".to_string(),
        "mars".to_string(),
        "avril".to_string(),
        "mai".to_string(),
        "juin".to_string(),
        "juillet".to_string(),
        "août".to_string(),
        "septembre".to_string(),
        "octobre".to_string(),
        "novembre".to_string(),
        "décembre".to_string()
    ];
}

impl EdtHour {
    pub fn generate(&self) -> Node<Msg> {
        li![
            style! {
                "background-color" => crate::config::get_color(&self.subject,&self.color);
            },
            C![format!("l{}", self.length)],
            a![C!["title"], crate::config::get_name(&self.subject)],
            if let Some(e) = &self.room {
                a![C!["title"], e]
            } else {
                empty![]
            },
            a![C!["timer", "timer-left"], HOURS.get(&self.hour).unwrap()]
        ]
    }
}
