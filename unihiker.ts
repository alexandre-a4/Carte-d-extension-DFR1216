//% weight=100 color=#0fbc11 icon="\uf085"
namespace DFR1216 {

    const I2C_ADDR = 0x33
    let initialized = false

    function init() {
        if (!initialized) {
            initialized = true
            basic.pause(100)
        }
    }

    function writeReg(reg: number, data: Buffer) {
        let buf = pins.createBuffer(data.length + 1)
        buf[0] = reg
        for (let i = 0; i < data.length; i++) {
            buf[i + 1] = data[i]
        }
        pins.i2cWriteBuffer(I2C_ADDR, buf)
    }

    function readReg(reg: number, len: number): Buffer {
        pins.i2cWriteNumber(I2C_ADDR, reg, NumberFormat.UInt8BE)
        return pins.i2cReadBuffer(I2C_ADDR, len)
    }

    // =========================
    // 🔋 SYSTEM
    // =========================

    //% block="battery level (%)"
    //% group="System"
    export function getBattery(): number {
        init()
        return readReg(0x87, 1)[0]
    }

    // =========================
    // 🎮 MOTORS
    // =========================

    //% block="run motor %m direction %dir speed %speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motors"
    export function motorRun(m: Motor, dir: MotorDirection, speed: number) {
        init()

        speed = Math.clamp(0, 100, speed)
        let duty = Math.map(speed, 0, 100, 0, 4095)

        let buf = pins.createBuffer(2)

        if (dir == MotorDirection.Forward) {
            buf[0] = (duty >> 8) & 0xFF
            buf[1] = duty & 0xFF
        } else {
            buf[0] = 0
            buf[1] = 0
        }

        writeReg(0x04 + m * 2, buf)
    }

    //% block="stop motor %m"
    //% group="Motors"
    export function motorStop(m: Motor) {
        init()
        writeReg(0x04 + m * 2, pins.createBuffer(2))
    }

    //% block="stop all motors"
    //% group="Motors"
    export function stopAllMotors() {
        init()
        for (let i = 0; i < 8; i++) {
            motorStop(i)
        }
    }

    // =========================
    // ⚙️ SERVOS
    // =========================

    //% block="set servo %s angle %angle"
    //% angle.min=0 angle.max=180
    //% group="Servos"
    export function setServoAngle(s: Servo, angle: number) {
        init()

        angle = Math.clamp(0, 180, angle)
        let period = 500 + angle * 11

        let buf = pins.createBuffer(2)
        buf[0] = (period >> 8) & 0xFF
        buf[1] = period & 0xFF

        writeReg(0x18 + s * 2, buf)
    }

    // =========================
    // 🌈 RGB LED
    // =========================

    //% block="set RGB0 %c0 RGB1 %c1 brightness %b"
    //% group="RGB"
    export function setRGBDual(c0: number, c1: number, b: number) {
        init()

        let buf = pins.createBuffer(8)
        buf[0] = 1
        buf[1] = b

        buf[2] = (c0 >> 16) & 0xFF
        buf[3] = (c0 >> 8) & 0xFF
        buf[4] = c0 & 0xFF

        buf[5] = (c1 >> 16) & 0xFF
        buf[6] = (c1 >> 8) & 0xFF
        buf[7] = c1 & 0xFF

        writeReg(0x90, buf)
    }

    //% block="turn off RGB"
    //% group="RGB"
    export function clearRGB() {
        setRGBDual(0, 0, 0)
    }

    // =========================
    // 🔘 GPIO
    // =========================

    //% block="set %io as digital output"
    //% group="GPIO"
    export function setDigitalOutput(io: IO) {
        init()
        writeReg(0x2c + io, pins.createBufferFromArray([4]))
    }

    //% block="set %io as digital input"
    //% group="GPIO"
    export function setDigitalInput(io: IO) {
        init()
        writeReg(0x2c + io, pins.createBufferFromArray([5]))
    }

    //% block="digital write %io to %state"
    //% group="GPIO"
    export function digitalWrite(io: IO, state: GPIOState) {
        init()
        writeReg(0x39 + io, pins.createBufferFromArray([state]))
    }

    //% block="digital read %io"
    //% group="GPIO"
    export function digitalRead(io: IO): number {
        init()
        return readReg(0x3f + io, 1)[0]
    }

    //% block="analog read %io"
    //% group="GPIO"
    export function analogRead(io: IO): number {
        init()
        let buf = readReg(0x45 + io * 3, 3)
        return (buf[1] << 8) | buf[2]
    }

    // =========================
    // 📏 ULTRASON
    // =========================

    //% block="distance (cm)"
    //% group="Sensors"
    export function distance(): number {
        init()

        writeReg(0x29, pins.createBufferFromArray([1]))
        basic.pause(30)

        let res = readReg(0x29, 3)
        if (res[0] == 2) {
            return (res[1] << 8) | res[2]
        }
        return -1
    }
}
