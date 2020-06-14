use serde::Deserialize;

#[derive(Deserialize)]
pub struct Output {
    pub name: String,
    pub studentClass: String,
    pub timetable: Vec<TimeTablePart>,
    pub homeworks: Vec<Homework>
}

impl Output {

    pub fn get_hours<'a>(&'a self) -> Vec<&'a Hour> {
        let mut vec: Vec<&Hour> = Vec::new();
        for i in &self.timetable {
            for x in &i.content {
                vec.push(&x);
            }
        }
        vec
    }
}

#[derive(Deserialize)]
pub struct Homework {
    pub subject: String,
    pub content: String,
    pub since: u64,
    pub until: u64,
    pub toGive: bool,
    pub files: Vec<File>,
}

#[derive(Deserialize)]
pub struct File {
    pub name: String,
    pub url: String
}

#[derive(Deserialize)]
pub struct TimeTablePart {
    pub time: u64,
    pub content: Vec<Hour>
}

#[derive(Deserialize)]
pub struct Hour {
    pub from: u64,
    pub to: u64,
    pub color: String,
    pub subject: String,
    pub teacher: String,
    pub room: Option<String>,
    pub away: bool,
    pub cancelled: bool
}