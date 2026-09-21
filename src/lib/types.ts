export interface TeamTask {
	naisteam: string;
	teknologi: string;
	dbname: string;
	okonomi: boolean;
	endringerUtenKrav: boolean;
	loggingLeseoperasjoner: boolean;
	fiksa: boolean;
	created: string;
	updated: string;
	loggingEndringer: boolean;
	funnetLogger: boolean;
	discardLogs: boolean;
}

export interface TeamsWithTasks {
	naisteam: string;
	tasksForTeam: TeamTask[];
}
