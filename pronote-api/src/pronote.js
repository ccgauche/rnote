const fs = require('fs');
const path = require('path');

const request = require('./request');
const cipher = require('./cipher');
const util = require('./util');

const sessions = {};

async function login({ username, password, url, cas, typecon })
{
    if (!username || !password || !url)
    {
        throw new Error('Bad request');
    }

    if (cas === 'none')
    {
        cas = null;
    }

    let time = new Date().getTime();

    let params = await init({
        username,
        password,
        url,
        cas,
        typecon
    });

    if (cas === 'parent')
    {
        cas = null;
    }

    const realUsername = username;

    if (cas)
    {
        username = params.e;
        password = params.f;
    }

    let session = cipher.createSession();

    cipher.init({
        session,

        modulo: params.MR,
        exposant: params.ER,
        noCompress: params.sCoA
    });

    request.initPronote({
        session,

        url,
        espace: params.a,
        sessionID: params.h,
        noAES: params.sCrA
    });

    const data = (await request.pronote({
        session,

        name: 'FonctionParametres',
        content: {
            donnees: {
                Uuid: cipher.getUUID(session)
            }
        }
    })).donnees;

    const periods = [];
    let specialPeriodID = 0;

    for (const period of data.General.ListePeriodes)
    {
        const result = {};

        if (period.L.startsWith('Trimestre'))
        {
            result.period = true;
            result.id = util.parsePeriod(period.L);
        } else if (period.L.startsWith('Semestre')) {
            result.period = true;
            result.id = 10+util.parsePeriod(period.L);
        } else {
            result.id = --specialPeriodID;
        }

        periods.push({
            N: period.N,
            name: period.L,
            from: util.parseDate(period.dateDebut.V),
            to: util.parseDate(period.dateFin.V),
            ...result
        });
    }

    session.periods = periods;

    let loginData = {
        session,

        name: 'Identification',
        content: {
            donnees: {
                genreConnexion: 0,
                genreEspace: session.espace,
                identifiant: username,
                pourENT: false,
                enConnexionAuto: false,
                demandeConnexionAuto: false,
                demandeConnexionAppliMobile: false,
                demandeConnexionAppliMobileJeton: false,
                uuidAppliMobile: "",
                loginTokenSAV: ""
            }
        }
    };

    if (cas)
    {
        loginData.content.donnees.pourENT = true;
    }

    let challenge = await request.pronote(loginData);
    cipher.setLoginKey(session, username, password, challenge.donnees.alea, cas);

    challenge = challenge.donnees.challenge;

    try
    {
        challenge = cipher.decipher({
            session,

            string: challenge,
            compress: false,
            alea: true,
            rsaKey: cipher.getLoginKey(session)
        });
    }
    catch (e)
    {
        throw 'Mauvais identifants';
    }

    challenge = cipher.cipher({
        session,

        string: challenge,
        compress: false,
        rsaKey: cipher.getLoginKey(session)
    });

    let auth = await request.pronote({
        session,

        name: 'Authentification',
        content: {
            donnees: {
                connexion: 0,
                challenge: challenge,
                espace: 3
            }
        }
    });

    if (!auth.donnees.ressource)
    {
        throw 'Mauvais identifiants';
    }

    if (auth.donnees.ressource.listeRessources && auth.donnees.ressource.listeRessources.length > 0)
    {
        auth.donnees.ressource = auth.donnees.ressource.listeRessources[0];
    }

    session.signEleve = {
        N: auth.donnees.ressource.N,
        G: auth.donnees.ressource.G
    };

    console.log(`Successfully logged user '${realUsername}' in ${(new Date().getTime() - time) / 1000}s`);
    sessions[realUsername] = { auth, session };

    return {
        success: true
    };
}

async function fetch({ username, password, url, cas, typecon})
{
    let time = new Date().getTime();

    if (!sessions[username]) {
        await login({ username, password, url, cas, typecon});
    }

    let { auth, session } = sessions[username];

    delete sessions[username];

    let result = {
        name: auth.donnees.ressource.L,
        studentClass: (auth.donnees.ressource.classeDEleve ? auth.donnees.ressource.classeDEleve.L :
            auth.donnees.ressource.listeRessources[0].classeDEleve.L),
        /*allInfo: {
            competences_N: 0,
            marks_N: 0,
            competences_A: false,
            homeworks_A: false,
            reports_A: false,
            contenuCours_A: false
        },*/
        //marks: [],
        //competences:[],
        timetable: [],
        //infos: [],
        //files: [],
        //reports: [],
        //absences: []
    };

    auth = auth.donnees;
    let key = /*user.Cle[0]._*/auth.cle;

    cipher.updateKey(session, key);

    const today = new Date();
    today.setHours(today.getHours() + 9);

    /*let home = await navigate(session, 7, 'PageAccueil', {
        menuDeLaCantine: {
            date: {
                _T: 7,
                V: `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()} 0:0:0`
            }
        }
    });*/

    /*if (home.donnees.menuDeLaCantine) {
        const menu = home.donnees.menuDeLaCantine.listeRepas.V;
        if (menu.length > 0) {
            const content = menu[0].listePlats.V;
            result['menu'] = [];

            for (let entry of content) {
                const food = entry.listeAliments.V;
                const foods = [];

                for (let f of food) {
                    foods.push(f.L);
                }

                result['menu'].push(foods);
            }
        }
    }*/

    //const periods = session.periods;
    //let defaultPeriod;

    /*for (const period of periods)
    {
        const res = await marks(session, periods, {
            N: period.N,
            G: 2,
            L: period.name
        });

        if (res.marks.length > 0)
        {
            if (period.period)
            {
                defaultPeriod = util.parsePeriod(period.name);
            }
            result.allInfo.marks_N =  result.allInfo.marks_N + res.marks_N;
            result['marks'].push({ period: period.id, ...res });
        }
    }*/

    /*if (!auth.listeOngletsInvisibles.includes(201))
    {
        result.allInfo.competences_A = true;
        for (const period of periods)
        {
            const res = await competences(session, periods, {
                N: period.N,
                G: 4,
                L: period.name
            });

            if (res.competences.length > 0)
            {
                if (period.period)
                {
                    defaultPeriod = util.parsePeriod(period.name);
                }

                result['competences'].push({ period: period.id, ...res });
                result.allInfo.competences_N = result.allInfo.competences_N + res.competences.length;
            }
        }
    }

    if (!defaultPeriod) {
        defaultPeriod = 1;
    }*/

    /*for (const period of periods)
    {
        if (period.id === defaultPeriod)
        {
            period.isDefault = true;
            break;
        }
    }*/

    //result['periods'] = periods.map(({ N, ...period }) => period);

    result['timetable'] = await timetable(session, auth.ressource);

    let weekShift = 9;

    if (new Date().getMonth() < 8) {
        weekShift = 17;
    }

    let first = new Date(result['timetable'][0].time).getWeek() + weekShift;
    let second = new Date(result['timetable'][1].time).getWeek() + weekShift;

    if (first > 44)
    {
        first -= 44;
    }

    if (second > 44)
    {
        second -= 44;
    }

    if (!auth.listeOngletsInvisibles.includes(88))
    {
        result['homeworks'] = (await homeworks(url, session, first)).concat(await homeworks(url, session, second));
        //result.allInfo.homeworks_A = true;
    }

    /*if (!auth.listeOngletsInvisibles.includes(89))
    {
        result['contenuCours'] = await contenuCours(url, session, first);
        result.allInfo.contenuCours_A = true;
    }*/

    /*const infos = (await navigate(session, 8, 'PageActualites', {
        estAuteur: false
    })).donnees.listeActualites.V;*/

    const date = new Date();
    date.setMonth(date.getMonth() - 3);

    //const maxDate = date.getTime();

    /*for (const info of infos)
    {
        const date = util.parseDate(info.dateDebut.V);
        if (maxDate > date) {
            continue;
        }

        result['infos'].push({
            time: date,
            title: info.L,
            teacher: info.elmauteur.V.L,
            content: info.listeQuestions.V[0].texte.V,
            files: info.listeQuestions.V[0].listePiecesJointes.V.map(f => file(url, session, f.L, { N: f.N, G: 50 }))
        });
    }*/

    /*result['infos'].sort((a, b) => {
        if (a.time < b.time)
        {
            return 1
        }

        if (a.time > b.time)
        {
            return -1;
        }

        return 0;
    });*/

    /*const files = (await navigate(session, 99, 'RessourcePedagogique', {
        avecRessourcesPronote: true,
        avecRessourcesEditeur: false
    })).donnees;*/

    /*const subjects = {};
    for (const subject of files.listeMatieres.V)
    {
        subjects[subject.N] = subject.L;
    }

    for (const f of files.listeRessources.V)
    {
        result['files'].push({
            time: util.parseDate(f.date.V),
            subject: subjects[f.matiere.V.N],
            name: f.ressource.V.L,
            url: file(url, session, f.ressource.V.L, f.ressource.V)
        });
    }*/

    /*for (const period of periods)
    {
        if (!period.period) {
            continue;
        }

        if (!auth.listeOngletsInvisibles.includes(13)) {
            result['reports'].push({ period: period.id, ...(await report(session, auth.ressource, period)) });
            result.allInfo.reports_A = true;
        }

    }

    const absences = await navigate(session, 19, 'PagePresence', {
        DateDebut: {
            _T: 7,
            V: "1/9/2019 0:0:0"
        },
        DateFin: {
            _T: 7,
            V: "10/7/2021 0:0:0"
        }
    });

    result['absences'] = absences.donnees.listeAbsences.V.map(absence => ({
        from: util.parseDate((absence.dateDebut || absence.date || absence.dateDemande).V),
        to: util.parseDate((absence.dateFin || absence.date || absence.dateDemande).V),
        solved: absence.reglee,
        justified: absence.justifie,
        reason: absence.listeMotifs && absence.listeMotifs.V.length > 0 ? absence.listeMotifs.V[0].L : ''
    }));

    try
    {
        result['avatar'] = Buffer.from(await request.http({
            url: file(url, session, 'photo.jpg', auth.ressource),
            binary: true
        }), 'binary').toString('base64');
    }
    catch (ignored)
    {
    }*/

    console.log(`Successfully fetched user '${username}' in ${(new Date().getTime() - time) / 1000}s`);
    return result;
}

function file(url, session, name, { N, G }) {
    return url + 'FichiersExternes' + '/' + cipher.cipher({
        session,
        string: JSON.stringify({ N, G })
    }) + '/' + encodeURIComponent(encodeURIComponent(name)) + '?Session=' + session.session;
}

async function marks(session, periods, period)
{
    const result = {
        marks: [],
        averages: {}, 
        marks_N: 0
    };

    const marks = await navigate(session, 198, 'DernieresNotes', {
        Periode: period
    });

    if (marks.donnees.moyGenerale) {
        result.averages = {
            student: util.parseMark(marks.donnees.moyGenerale.V),
            studentClass: util.parseMark(marks.donnees.moyGeneraleClasse.V)
        };
    }

    result.marks = marks.donnees.listeServices.V.map(subject => {
        return {
            name: subject.L,
            id: subject.N,
            average: util.parseMark(subject.moyEleve.V),
            studentClassAverage: util.parseMark(subject.moyClasse.V),
            maxAverage: util.parseMark(subject.moyMax.V),
            minAverage: util.parseMark(subject.moyMin.V),
            marks: []
        };
    });

    result.marks_N = marks.donnees.listeDevoirs.V.length;

    marks.donnees.listeDevoirs.V.forEach(mark => {
        let subjectId = mark.service.V.N;
        let subjectIndex = result.marks.findIndex(x => x.id === subjectId);

        const value = util.parseMark(mark.note.V);

        result.marks[subjectIndex].marks.push({
            id: mark.N,
            subject: mark.service.V.L,
            title: mark.commentaire,
            value,
            away: value === -1 || isNaN(value) || value === null || value === undefined,
            max: util.parseMark(mark.bareme.V),
            average: util.parseMark(mark.moyenne.V),
            coefficient: mark.coefficient,
            higher: util.parseMark(mark.noteMax.V),
            lower: util.parseMark(mark.noteMin.V),
            time: util.parseDate(mark.date.V),
            period: util.parsePeriodBis(periods, mark.periode.V.L)
        });
    });

    return result;
}

async function competences(session, periods, period)
{
    const result = {
        competences: []
    };

    const competences = await navigate(session, 201, 'DernieresEvaluations', {
        periode: period
    });

    competences.donnees.listeEvaluations.V.forEach(competences => {
        let subjectId = competences.matiere.V.N;
        let subjectIndex = result.competences.findIndex(x => x.id === subjectId);

        if (subjectIndex == -1) {
                result.competences.push({
                name: competences.matiere.V.L,
                id: competences.matiere.V.N,
                prof: competences.individu.V.L,
                Evaluations: []
            });
        }
    });

    competences.donnees.listeEvaluations.V.forEach(competence => {
        let subjectId = competence.matiere.V.N;
        let subjectIndex = result.competences.findIndex(x => x.id === subjectId);

        const competencesArray = [];

        competence.listeNiveauxDAcquisitions.V.forEach(competence=> {
            competencesArray.push({
                id: competence.domaine.V.N,
                name: competence.domaine.V.L,
                value: competence.L,
                abbreviation: competence.abbreviation
            })
        })
        result.competences[subjectIndex].Evaluations.push({
            id: competence.N,
            name: competence.L,
            coefficient: competence.coefficient,
            time: util.parseDate(competence.date.V),
            period: util.parsePeriodBis(periods, competence.periode.V.L),
            competences: competencesArray
        });
    });

    return result;
}

async function timetable(session, user)
{
    let weekAmount = 9;

    if (new Date().getMonth() < 8) {
        weekAmount = 17;
    }

    let weeks = [];
    let week = new Date().getWeek() + weekAmount;

    if (new Date().getDay() === 7)
    {
        week++;
    }

    while (weeks.length < 4)
    {
        let shifted = false;
        if (week > 44)
        {
            week -= 44;
            shifted = true;
        }

        let content = await readWeek(week);

        if (content.length > 0)
        {
            let realWeek = week - weekAmount;
            if (shifted) {
                realWeek += 44;
            }
            if (realWeek < 0) {
                realWeek += 52;
            } else if (realWeek > 52) {
                realWeek -= 52;
            }

            let time = new Date();
            time.setMonth(0);
            time.setDate((realWeek - 1) * 7);
            time.setHours(6); // In case
            time.setMinutes(0);
            time.setSeconds(0);
            time.setMilliseconds(0);

            weeks.push({
                time: util.getTime(time),
                content: content
            });
        }

        week++;
    }

    async function readWeek(id)
    {
        let result = [];

        let timetable = await navigate(session, 16, 'PageEmploiDuTemps', {
            //xml: `<PageEmploiDuTemps><Ressource G="${user.G}" N="${user.N}" L="${user.L}" E="0"/><NumeroSemaine T="1">${id}</NumeroSemaine></PageEmploiDuTemps>`
            ressource: {
                N: user.N,
                G: user.G,
                L: user.L
            },
            numeroSemaine: id,
            avecAbsencesEleve: false,
            avecConseilDeClasse: true,
            estEDTPermanence: false,
            avecAbsencesRessource: true,
            Ressource: {
                N: user.N,
                G: user.G,
                L: user.L
            },
            NumeroSemaine: id
        });

        timetable.donnees.ListeCours.forEach(lesson => {
            let from;
            let to;
            try { //Patch to prevent crash where informations isn't given.
                from = util.parseDate(lesson.DateDuCours.V);
                to = new Date(from);
                to.setHours(to.getHours() + (lesson.duree * 0.50));
                to = to.getTime();
            } catch {
                let from = undefined;
                let to = undefined;
            }
            let res = {
                from,
                to,
                color: lesson.CouleurFond || '#FFF'
            };

            if (lesson.ListeContenus) {
                res.subject = lesson.ListeContenus.V[0].L;
                res.teacher = lesson.ListeContenus.V.length > 1 ? lesson.ListeContenus.V[1].L : 'Aucun prof';
            } else if (lesson.estSortiePedagogique) {
                res.subject = "Sortie pédagogique";
                res.teacher = 'Aucun prof';
            }

            try {
                if (lesson.ListeContenus.V.length > 2) {
                    let room = lesson.ListeContenus.V[lesson.ListeContenus.V.length - 1].L;

                    if (!room.startsWith('[') && !room.startsWith('<')) {
                        res['room'] = room;
                    }
                }
            } catch (e) {}

            res['away'] = lesson.Statut === 'Prof. absent' || lesson.Statut === 'Conseil de classe';
            res['cancelled'] = lesson.Statut === 'Cours annulé';
            res['priority'] = lesson.Statut === 'Cours modifié' || lesson.Statut === 'Cours maintenu' || lesson.Statut === 'Remplacement';

            result.push(res);
        });

        let checked = [];

        main:
        for (let lesson of result)
        {
            for (let i = 0; i < checked.length; i++)
            {
                if (lesson.from === checked[i].from || lesson.to === checked[i].to)
                {
                    if (lesson.priority) {
                        checked[i] = lesson;
                    }

                    continue main;
                }
            }

            checked.push(lesson);
        }

        checked.sort((a, b) => {
            if (a.from < b.from)
            {
                return -1
            }

            if (a.from > b.from)
            {
                return 1;
            }

            return 0;
        });

        checked.forEach(l => delete l.priority);

        return checked;
    }

    return weeks;
}

async function homeworks(url, session, week)
{
    let result = [];

    let homeworks = await navigate(session, 88, 'PageCahierDeTexte', {
        domaine: {
            "_T": 8,
            "V": "[" + week + ".." + week + "]"
        }
    });

    //homeworks = await readXML(homeworks.xml);
    homeworks = homeworks.donnees.ListeTravauxAFaire.V;

    if (homeworks === undefined)
    {
        return [];
    }

    homeworks.forEach(homework => {
        let content = homework.descriptif.V;
        content = content.substring(5, content.length - 6);

        result.push({
            subject: homework.Matiere.V.L,
            content: util.decodeHTML(content),
            since: util.parseDate(homework.DonneLe.V),
            until: util.parseDate(homework.PourLe.V),
            toGive: !!homework.avecRendu,
            files: homework.ListePieceJointe.V.map(f => ({
                name: f.L,
                url: file(url, session, f.L, { N: f.N, G: 48 })
            }))
        });
    });

    result.sort((a, b) => {
        if (a.until < b.until)
        {
            return -1
        }

        if (a.until > b.until)
        {
            return 1;
        }

        return 0;
    });

    return result;
}

async function contenuCours(url, session, week)
{
    let result = [];

    week1 = week-20 ;
    week2 = week+10;

    let contenuCours = await navigate(session, 89, 'PageCahierDeTexte', {
        domaine: {
            "_T": 8,
            "V": "[" + week1 + ".." + week2 + "]"
        }
    });

    contenuCours = contenuCours.donnees.ListeCahierDeTextes.V;

    if (contenuCours === undefined)
    {
        return [];
    }

    contenuCours.forEach(contenuCours => {
        let content = "";
        let files;
        contenuCours.listeContenus.V.forEach(contenuCours2 => {
            content = content + contenuCours2.descriptif.V;
            files = contenuCours2.ListePieceJointe.V.map(f => ({
                name: f.L,
                url: file(url, session, f.L, { N: f.N, G: 48 })
            }))
        });
        
        var regex = /<[^>]*>/g;
        content = content.replace(regex, "");

        result.push({
            subject: contenuCours.Matiere.V.L,
            content: util.decodeHTML(content),
            since: util.parseDate(contenuCours.Date.V),
            until: util.parseDate(contenuCours.DateFin.V),
           file: files
        });
    });

    result.sort((a, b) => {
        if (a.until < b.until)
        {
            return -1
        }

        if (a.until > b.until)
        {
            return 1;
        }

        return 0;
    });

    return result;
}

async function report(session, { N, G, L }, period)
{
    const report = (await navigate(session, 13, 'PageBulletins', {
        eleve: { N, G, L },
        periode: {
            N: period.N,
            G: 2,
            L: period.name
        }
    })).donnees;

    if (!report.General) {
        return null;
    }

    const result = {
        subjects: [],
        averages: {},
        comments: []
    };

    for (const comment of report.ObjetListeAppreciations.V.ListeAppreciations.V)
    {
        if (!comment.L)
        {
            continue;
        }

        result['comments'].push({
            title: comment.Intitule,
            value: comment.L
        });
    }

    result['averages'] = {
        student: util.parseMark(report.General.V.MoyenneEleve.V),
        studentClass: util.parseMark(report.General.V.MoyenneClasse.V)
    };

    for (const subject of report.ListeServices.V)
    {
        const mark = {
            name: subject.L,
            average: util.parseMark(subject.MoyenneEleve.V),
            studentClassAverage: util.parseMark(subject.MoyenneClasse.V),
            comment: subject.ListeAppreciations.V[0].L || '',
            coefficient: parseInt(subject.Coefficient.V)
        };

        if (subject.MoyenneSup) {
            mark.maxAverage = util.parseMark(subject.MoyenneSup.V);
            mark.minAverage = util.parseMark(subject.MoyenneInf.V);
        }

        result['subjects'].push(mark);
    }

    return result;
}

async function navigate(session, id, name, data = {})
{
    await request.pronote({
        session,
        name: 'Navigation',
        content: {
            donnees: {
                onglet: id
            },
            _Signature_: {
                onglet: id
            }
        },
    });

    let content = {
        _Signature_: {
            onglet: id
        },
        donnees: data
    };

    if (data.xml)
    {
        content['xml'] = data.xml;
        delete content['donnees'].xml;
    }

    return request.pronote({
        session,

        name: name,
        content: content
    });
}

async function init({ username, password, url, cas, typecon})
{
    if (!cas)
    {
        cas = 'none';
    }

    try {
      let access = await fs.promises.access(path.join(__dirname, '/cas/', cas + '.js'), fs.constants.F_OK);

        if (typeof(typecon) == "undefined" && typecon == null) {
            typecon = "eleve.html";
        }
        url = url+typecon;

      return await require(path.join(__dirname, '/cas/', cas + '.js'))({
          username,
          password,
          url
      });
    }
    catch(err) {
      console.error(err);
      throw `Unknown CAS`;
    }
}

module.exports = { login, fetch };
