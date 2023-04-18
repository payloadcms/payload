import { Express, Router } from 'express';
import { Endpoint } from '../config/types';
declare function mountEndpoints(express: Express, router: Router, endpoints: Endpoint[]): void;
export default mountEndpoints;
