// Import discord.js and create the client
const Discord = require('discord.js')
const client = new Discord.Client();
const TOURNAMENT_ID = '5733513436764454912'
const DISCORD_TOKEN = 'OTgyOTgwMzQyMjU0Mjg4ODk2.GRgSod.w8uKV2G9nipnzIZsRjVfPXk9D0giPsMr83Kmr4'
const fs = require('fs');
const { clearInterval } = require('timers');
const {getTournamentParticipants} = require('./scraper.js')
let INTERVALID = 0
//const Cachedteams = require('./cachedTeams.json'); 

// Register an event so that when the bot is ready, it will log a messsage to the terminal
client.on('ready', async() => {
  console.log(`Logged in as ${client.user.tag}!`);
})

// Register an event to handle incoming messages
client.on('message', async msg => {
  let channelID = msg.channel.id
  // This block will prevent the bot from responding to itself and other bots
  if(msg.author.bot) {
    return
  }

  if(msg.content.startsWith("!stop")){
    let inputs = msg.content.split(" ")
    if (inputs.length == 2) {
      let tournamentId = inputs[1]
      if (INTERVALID == 0) {
        msg.author.send('Update isnt running, use !start to start updating')
      } else {
        clearInterval(INTERVALID)
        msg.author.send('Updating stopped in channel: ' + channelID + "With tournament ID: " + tournamentId)
        INTERVALID = 0
      }
    } else {
      msg.author.send('Input error, your message should contain !stop <tournament ID>. Your message was: ' + msg.content)
    }     
  }
  // Check if the message starts with '!hello' and respond with 'world!' if it does.
  if(msg.content.startsWith("!start")){
    let inputs = msg.content.split(" ")
    if (inputs.length == 2) {
      let tournamentId = inputs[1]
      if (INTERVALID == 0) {
        INTERVALID = setInterval(UpdateCurrentlyRegisteredChannel, 300000)
        UpdateCurrentlyRegisteredChannel(channelID, tournamentId)
        console.log('Started updating')
        msg.author.send('Updating every 5 minutes, in channel: ' + channelID + "With tournament ID: " + tournamentId)
      } else {
        msg.author.send('Updating already running, use !stop to stop updating')
      }
    } else {
      msg.author.send('Input error, your message should contain !start <tournament ID>. Your message was: ' + msg.content)
    }   
  }  
  msg.delete()  
})

// Login to Discord with your client's token
client.login(DISCORD_TOKEN);

async function UpdateCurrentlyRegisteredChannel(channelID, tournamentId) {
  console.log('Checking for updates')
  let teams = await getTournamentParticipants(tournamentId)
  let CachedteamsJSON = fs.readFileSync("cachedTeams.json");
  let Cachedteams = JSON.parse(CachedteamsJSON);
  console.log(Object.keys(teams));
  for (let team of Object.keys(teams)) {
    if (!Object.keys(Cachedteams).includes(team)) {
      createMessage(team, teams, channelID);
      Cachedteams[team] = teams[team];
      console.log('New team: ' + team)
    }
  }
  fs.writeFileSync('cachedTeams.json', JSON.stringify(teams, null, 2));
}

function createMessage(team, teams, channelID){
  let message = ""
  message += `${convertCountryCodeToFlagEmoji(teams[team].countryCode)} **${team}** ${convertCountryCodeToFlagEmoji(teams[team].countryCode)} \n\n`
  let members = teams[team].members
  for (let member of Object.keys(members)){
    message += `${convertCountryCodeToFlagEmoji(members[member].countryCode)} ${members[member].name} ${convertCountryCodeToFlagEmoji(members[member].countryCode)} \n`
  }
  message += '----------------------------------------------------------------------------------------------'
  client.channels.cache.get(channelID).send(message) 
}

function convertCountryCodeToFlagEmoji(countryCode){
  return ':flag_' + countryCode + ':'
}