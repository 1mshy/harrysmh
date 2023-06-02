const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const pvp = require('mineflayer-pvp').plugin
const Vec3 = require('vec3').Vec3;

const bot = mineflayer.createBot(
    {
        host: 'harrys.network',
        auth: 'microsoft',
        username: 'Lazy_Kid',
        version: '1.8.9'
    }
)
const bot2 = mineflayer.createBot(
    {
        host: 'harrys.network',
        auth: 'microsoft',
        username: 'uwureach',
        version: '1.8.9'
    }
)

async function setupBot(tempbot) {
    await tempbot.loadPlugin(pathfinder)
    await tempbot.loadPlugin(pvp)
    await tempbot.on('kicked', console.log)
    await tempbot.on('chat', async (username, message) => {
        if (username === tempbot.username) return
        if(username == "DISCORD" ) {
            joinLobby(tempbot)
        }
        if(message == "why") {
            walktoMid(tempbot)
        }
        console.log(`${username} said "${message}"`)
      })
      await tempbot.on("error", (err) => {
        console.log(err)
    })
    let counter = 0
    await tempbot.on("physicTick", async () => {
        if(counter%41==0) {
            walktoMid(tempbot)
            counter -= 40
        }
        counter+= 1;
    })
}
function setupBots(array1) {
    array1.forEach(
        (tempbot) => {
            console.log(tempbot.username + " is being loaded")
            setupBot(tempbot)
        }
    )
}

async function walktoMid(tempbot) {
    var pos = new Vec3(0, 73, 0);
    tempbot.lookAt(pos)
    tempbot.setControlState('forward', true)
    await sleep(1600)
    tempbot.setControlState('forward', false)
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

async function joinLobby(tempbot) {
    await sleep(5000)
    await console.log(tempbot.entity.username + " is joining lobby")
    await tempbot.chat('/play pit')
    await console.log("Success!!")
}


let arrayOfBots = [bot, bot2]
setupBots(arrayOfBots)