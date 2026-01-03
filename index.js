const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const pvp = require('mineflayer-pvp').plugin
const Vec3 = require('vec3').Vec3
const readline = require('readline')
const fs = require('fs')
const path = require('path')

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir)
}

// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')
const logFile = path.join(logsDir, `bot-${timestamp}.log`)
const logStream = fs.createWriteStream(logFile, { flags: 'a' })

// Logging function that writes to both console and file
function log(message) {
    const timestampedMessage = `[${new Date().toLocaleTimeString()}] ${message}`
    console.log(message)
    logStream.write(timestampedMessage + '\n')
}

// Create readline interface for terminal commands
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const bot = mineflayer.createBot({
    host: 'harrys.gg',
    auth: 'microsoft',
    username: 'shyfly',
    version: '1.8.9'
})

// Bot state
let autoWalk = false
let isConnected = false

async function setupBot(tempbot) {
    tempbot.loadPlugin(pathfinder)
    tempbot.loadPlugin(pvp)

    tempbot.on('spawn', () => {
        isConnected = true
        log(`[${tempbot.username}] Spawned in the world!`)
        log('Type "help" for available commands.')
    })

    tempbot.on('kicked', (reason) => {
        isConnected = false
        log(`[${tempbot.username}] Kicked: ${reason}`)
    })

    tempbot.on('end', () => {
        isConnected = false
        log(`[${tempbot.username}] Disconnected`)
    })

    tempbot.on('chat', async (username, message) => {
        if (username === tempbot.username) return
        if (username === "DISCORD") {
            joinLobby(tempbot)
        }
        if (message === "why") {
            walktoMid(tempbot)
        }
        log(`[CHAT] ${username}: ${message}`)
    })

    tempbot.on("error", (err) => {
        log(`[ERROR] ${err.message}`)
    })

    // Auto-walk ticker (disabled by default)
    let counter = 0
    tempbot.on("physicsTick", async () => {
        // Keep head looking straight forward (pitch = 0)
        tempbot.look(tempbot.entity.yaw, 0, true)
        
        if (autoWalk && counter % 41 === 0) {
            walktoMid(tempbot)
            counter = 0
        }
        counter++
    })
}

function setupBots(array1) {
    array1.forEach((tempbot) => {
        log(`[SETUP] ${tempbot.username} is being loaded...`)
        setupBot(tempbot)
    })
}

async function walktoMid(tempbot) {
    const pos = new Vec3(0, 73, 0)
    tempbot.lookAt(pos)
    tempbot.setControlState('forward', true)
    await sleep(1600)
    tempbot.setControlState('forward', false)
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function joinLobby(tempbot) {
    await sleep(5000)
    log(`[${tempbot.username}] Joining lobby...`)
    tempbot.chat('/play pit')
    log(`[${tempbot.username}] Join command sent!`)
}

// Terminal command handler
function handleCommand(input) {
    const args = input.trim().split(' ')
    const command = args[0].toLowerCase()
    const params = args.slice(1)

    switch (command) {
        case 'help':
            log('\n=== Available Commands ===')
            log('help          - Show this help message')
            log('chat <msg>    - Send a chat message')
            log('cmd <cmd>     - Send a server command (e.g., cmd /play pit)')
            log('walk          - Walk to mid once')
            log('autowalk      - Toggle auto-walk to mid')
            log('jump          - Make the bot jump')
            log('stop          - Stop all movement')
            log('pos           - Show current position')
            log('health        - Show health and hunger')
            log('players       - List online players')
            log('join          - Join the pit lobby')
            log('look <x> <y> <z> - Look at coordinates')
            log('quit          - Disconnect and exit')
            log('==========================\n')
            break

        case 'chat':
            if (params.length === 0) {
                log('[ERROR] Usage: chat <message>')
            } else {
                bot.chat(params.join(' '))
                log(`[SENT] ${params.join(' ')}`)
            }
            break

        case 'cmd':
            if (params.length === 0) {
                log('[ERROR] Usage: cmd <command>')
            } else {
                const cmd = params.join(' ')
                bot.chat(cmd)
                log(`[CMD] Sent: ${cmd}`)
            }
            break

        case 'walk':
            walktoMid(bot)
            log('[ACTION] Walking to mid...')
            break

        case 'autowalk':
            autoWalk = !autoWalk
            log(`[ACTION] Auto-walk ${autoWalk ? 'ENABLED' : 'DISABLED'}`)
            break

        case 'jump':
            bot.setControlState('jump', true)
            setTimeout(() => bot.setControlState('jump', false), 100)
            log('[ACTION] Jumping!')
            break

        case 'stop':
            bot.clearControlStates()
            autoWalk = false
            log('[ACTION] Stopped all movement')
            break

        case 'pos':
            if (bot.entity) {
                const pos = bot.entity.position
                log(`[INFO] Position: X=${pos.x.toFixed(2)}, Y=${pos.y.toFixed(2)}, Z=${pos.z.toFixed(2)}`)
            } else {
                log('[ERROR] Bot not spawned yet')
            }
            break

        case 'health':
            if (isConnected) {
                log(`[INFO] Health: ${bot.health}/20 | Food: ${bot.food}/20`)
            } else {
                log('[ERROR] Bot not connected')
            }
            break

        case 'players':
            const players = Object.keys(bot.players)
            log(`[INFO] Online players (${players.length}): ${players.join(', ')}`)
            break

        case 'join':
            joinLobby(bot)
            break

        case 'look':
            if (params.length < 3) {
                log('[ERROR] Usage: look <x> <y> <z>')
            } else {
                const [x, y, z] = params.map(Number)
                bot.lookAt(new Vec3(x, y, z))
                log(`[ACTION] Looking at ${x}, ${y}, ${z}`)
            }
            break

        case 'quit':
        case 'exit':
            log('[INFO] Disconnecting...')
            logStream.end()
            bot.quit()
            rl.close()
            process.exit(0)
            break

        default:
            if (command) {
                log(`[ERROR] Unknown command: ${command}. Type "help" for commands.`)
            }
            break
    }
}

// Listen for terminal input
rl.on('line', (input) => {
    handleCommand(input)
})

rl.on('close', () => {
    log('[INFO] Terminal closed')
    logStream.end()
    bot.quit()
    process.exit(0)
})

// Start the bot
const arrayOfBots = [bot]
setupBots(arrayOfBots)

log('[INFO] Bot starting... Type "help" for available commands.')
log(`[INFO] Logging to: ${logFile}`)