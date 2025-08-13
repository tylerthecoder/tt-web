import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({ colorize: true, ignore: 'pid,hostname' });

export const baseLogger = pino(
    { level: 'debug' },
    stream
);