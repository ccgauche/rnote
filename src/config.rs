lazy_static! {
    static ref SUBJECTS_COLORS: Vec<(String, String)> =
        load_yml(include_str!("config/subjects-colors.yml"));
    static ref SUBJECTS_NAMES: Vec<(String, String)> =
        load_yml(include_str!("config/subjects-names.yml"));
}

fn load_yml(file: &str) -> Vec<(String, String)> {
    file.lines()
        .flat_map(|x| {
            let mut o = x.split(": ");
            Some((o.next()?.to_string(), o.next()?.to_string()))
        })
        .collect::<Vec<(String, String)>>()
}

pub fn get_color(subject: &str, color: &str) -> String {
    for (sub, color) in SUBJECTS_COLORS.iter() {
        if subject.starts_with(sub) {
            return color.to_string();
        }
    }
    return color.to_string();
}

pub fn get_name(subject: &str) -> String {
    for (sub, name) in SUBJECTS_NAMES.iter() {
        if subject.starts_with(sub) {
            return name.to_string();
        }
    }
    return subject.to_string();
}
