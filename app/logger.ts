import pino from 'pino';

export const baseLogger = pino({
    name: "tt-web",
    transport: {
        target: 'pino-pretty',
        options: {
            ignore: 'module,filename',
        }
    },
});