const axios = require('axios').default;
const { JSDOM } = require('jsdom');

const BASE_URL = 'https://play.toornament.com/en_US/tournaments';
const BELIEVABLE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0',
};
const MAX_PAGES = 20;

/**
 * Get teams and their members for a specific tournament
 *
 * @param {string} tournamentId ID of the tournament
 * @returns {object} Teams and members
 */
async function getTournamentParticipants(tournamentId) {
    let teams = {};
    // Get list of participants from main page
    for (let i = 1; i < MAX_PAGES; i++) {
        const response = await axios({
            method: 'GET',
            url: `${BASE_URL}/${tournamentId}/participants/`,
            headers: BELIEVABLE_HEADERS,
            params: { page: i },
            validateStatus: s => (s >= 200 && s < 300) || s == 404,
        });
        if (response.status == 404) break;
        const teamListDOM = new JSDOM(response.data);
        for (const div of teamListDOM.window.document.querySelectorAll('a > div.participant').values()) {
            const countryCode = div.children[0].children[0].innerHTML.split("-")[2].split("\"")[0]
            const teamName = div.querySelector('div.name').textContent
            const participantID = div.parentElement['href'].split('/').slice(-2)[0];
            teams[teamName] = {'teamID': participantID, 'countryCode': countryCode}
        }
        await RandomSleep();
    }
    // Toornament has very pricy APIs, surely they are not happy to get scraped
    await RandomSleep();
    for (const [team, teamInfo] of Object.entries(teams)) {
        let members = [];
        const teamInfoResp = await axios({
            method: 'GET',
            url: `${BASE_URL}/${tournamentId}/participants/${teamInfo.teamID}/info`,
            headers: BELIEVABLE_HEADERS,
        });
        const teamInfoDOM = new JSDOM(teamInfoResp.data);
        for (const [i, memberDiv] of teamInfoDOM.window.document
            .querySelectorAll('div.text.standard.country')
            .entries()) {
            if (i == 0) continue;
            const actualDiv = memberDiv.parentElement.parentElement;
            memberCountryCode = actualDiv.children[0].children[0].innerHTML.split("-")[2].split("\"")[0]
            memberName = actualDiv.children[0].children[0].textContent.trim()
            memberCountry = actualDiv.children[1].textContent.trim().replace(/\s/g, '').split(":")[1]
            members.push({'name': memberName,
                          'country': memberCountry,
                          'countryCode': memberCountryCode});            
        }
        teamCountry = teamInfoDOM.window.document.querySelector('div.text.standard.small.country').textContent.trim().replace(/\s/g, '').split(":")[1]
        teams[team] = {'country': teamCountry,
                       'countryCode': teamInfo.countryCode,
                       'members': members}
        //teams[team] = members;
        await RandomSleep();
    }
    return teams;
}

async function RandomSleep(){
    let delay = (Math.random());
    console.log(delay)
    setTimeout(function(){ 

        console.log('waiting');
    }, delay);  
}

exports.getTournamentParticipants = getTournamentParticipants;