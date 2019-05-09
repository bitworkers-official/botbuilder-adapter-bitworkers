module.exports = {
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    global: {}, // botframework needs the global variable
  },
}
