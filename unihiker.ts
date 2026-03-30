//% weight=100 color=#0fbc11 icon="\uf085"
namespace a4_DFR1216 {

    const I2C_ADDR = 0x33

    let initialized = false
    let lastDirection = [0, 0, 0, 0]
    let globalBrightness = 255

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

    //% block="run %m direction %dir speed %speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motors"
    export function motorRun(m: MotorID, dir: MotorDirection, speed: number) {

        init()

        speed = Math.clamp(0, 100, speed)
        let duty = Math.map(speed, 0, 100, 0, 4095)

        let base = 0x04 + m * 4

        // stop avant inversion
        if (lastDirection[m] != dir) {
            writeReg(base, pins.createBuffer(2))
            writeReg(base + 2, pins.createBuffer(2))
            basic.pause(50)
        }

        let buf = pins.createBuffer(2)
        buf[0] = (duty >> 8) & 0xFF
        buf[1] = duty & 0xFF

        if (dir == MotorDirection.CW) {
            writeReg(base, buf)
            writeReg(base + 2, pins.createBuffer(2))
        } else {
            writeReg(base + 2, buf)
            writeReg(base, pins.createBuffer(2))
        }

        lastDirection[m] = dir
    }

    //% block="stop %m"
    //% group="Motors"
    export function motorStop(m: MotorID) {
        init()
        let base = 0x04 + m * 4
        writeReg(base, pins.createBuffer(2))
        writeReg(base + 2, pins.createBuffer(2))
    }

    //% block="stop all motors"
    //% group="Motors"
    export function stopAllMotors() {
        init()
        for (let i = 0; i < 4; i++) {
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

    //% block="set %index R %r G %g B %b"
    //% r.min=0 r.max=255
    //% g.min=0 g.max=255
    //% b.min=0 b.max=255
    //% group="RGB"
    export function setRGB(index: RGBIndex, r: number, g: number, b: number) {

        init()

        let buf = pins.createBuffer(8)

        buf[0] = 1
        buf[1] = globalBrightness

        function setColor(offset: number) {
            buf[offset] = r
            buf[offset + 1] = g
            buf[offset + 2] = b
        }

        if (index == RGBIndex.RGB0) {
            setColor(2)
        } else if (index == RGBIndex.RGB1) {
            setColor(5)
        } else {
            setColor(2)
            setColor(5)
        }

        writeReg(0x90, buf)
    }

    //% block="set %index color %color"
    //% group="RGB"
    export function setRGBColor(index: RGBIndex, color: RGBColor) {

        let r = 0
        let g = 0
        let b = 0

        switch (color) {
            case RGBColor.Red: r = 255; break
            case RGBColor.Green: g = 255; break
            case RGBColor.Blue: b = 255; break
            case RGBColor.Yellow: r = 255; g = 255; break
            case RGBColor.Cyan: g = 255; b = 255; break
            case RGBColor.Magenta: r = 255; b = 255; break
            case RGBColor.White: r = 255; g = 255; b = 255; break
            case RGBColor.Off: default: break
        }

        setRGB(index, r, g, b)
    }

    //% block="set RGB brightness %b"
    //% b.min=0 b.max=255
    //% group="RGB"
    export function setBrightness(b: number) {
        globalBrightness = Math.clamp(0, 255, b)
    }

    //% block="turn off RGB"
    //% group="RGB"
    export function clearRGB() {
        setRGB(RGBIndex.Both, 0, 0, 0)
    }

    // =========================
    // 🔘 GPIO (AUTO CONFIG)
    // =========================

    function setAnalogInput(io: IO) {
        writeReg(0x2c + io, pins.createBufferFromArray([2]))
    }

    //% block="digital write %io to %state"
    //% group="GPIO"
    export function digitalWrite(io: IO, state: GPIOState) {
        init()
        setDigitalOutput(io)
        writeReg(0x39 + io, pins.createBufferFromArray([state]))
    }

    //% block="read digital %io"
    //% group="GPIO"
    export function readDigital(io: IO): number {

        init()

        setDigitalInput(io)
        basic.pause(10)

        return readReg(0x3f + io, 1)[0]
    }

    //% block="analog read %io"
    //% group="GPIO"
    export function analogRead(io: IO): number {
        init()

        setAnalogInput(io)

        let buf = readReg(0x45 + io * 3, 3)
        return (buf[1] << 8) | buf[2]
    }

    function setDigitalOutput(io: IO) {
        writeReg(0x2c + io, pins.createBufferFromArray([4]))
    }

    function setDigitalInput(io: IO) {
        writeReg(0x2c + io, pins.createBufferFromArray([5]))
    }

    // =========================
    // 📏 SENSOR
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
