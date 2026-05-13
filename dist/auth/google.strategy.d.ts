import { ConfigService } from '@nestjs/config';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
export type GoogleValidatedUser = {
    email: string;
    firstName: string;
    lastName: string;
};
declare const GoogleStrategy_base: new (...args: [options: import("passport-google-oauth20").StrategyOptionsWithRequest] | [options: StrategyOptions] | [options: StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    private readonly config;
    constructor(config: ConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: {
        emails?: {
            value: string;
        }[];
        name?: {
            givenName?: string;
            familyName?: string;
        };
    }): GoogleValidatedUser;
}
export {};
