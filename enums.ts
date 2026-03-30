//% color=#2E8B57
enum Motor {
    //% block="M1 A"
    M1A = 0,
    //% block="M1 B"
    M1B,
    //% block="M2 A"
    M2A,
    //% block="M2 B"
    M2B,
    //% block="M3 A"
    M3A,
    //% block="M3 B"
    M3B,
    //% block="M4 A"
    M4A,
    //% block="M4 B"
    M4B
}

//% color=#2E8B57
enum MotorDirection {
    //% block="forward"
    Forward = 0,
    //% block="backward"
    Backward = 1
}

//% color=#1E90FF
enum Servo {
    S0 = 0,
    S1,
    S2,
    S3,
    S4,
    S5
}

//% color=#FF8C00
enum IO {
    C0 = 0,
    C1,
    C2,
    C3,
    C4,
    C5
}

//% color=#FF8C00
enum GPIOState {
    //% block="LOW"
    Low = 0,
    //% block="HIGH"
    High = 1
}
