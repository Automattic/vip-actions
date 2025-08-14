import * as core from '@actions/core';
import { Doctor } from './doctor.js';

export async function run(): Promise< void > {
	try {
		const doctor = new Doctor();
		await doctor.run();
	} catch ( error ) {
		if ( error instanceof Error ) {
			core.setFailed( error.message );
		} else {
			core.setFailed( String( error ) );
		}
	}
}
