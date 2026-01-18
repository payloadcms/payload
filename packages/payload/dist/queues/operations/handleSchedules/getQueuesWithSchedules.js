export const getQueuesWithSchedules = ({ jobsConfig })=>{
    const tasksWithSchedules = jobsConfig.tasks?.filter((task)=>{
        return task.schedule?.length;
    }) ?? [];
    const workflowsWithSchedules = jobsConfig.workflows?.filter((workflow)=>{
        return workflow.schedule?.length;
    }) ?? [];
    const queuesWithSchedules = {};
    for (const task of tasksWithSchedules){
        for (const schedule of task.schedule ?? []){
            ;
            (queuesWithSchedules[schedule.queue] ??= {
                schedules: []
            }).schedules.push({
                scheduleConfig: schedule,
                taskConfig: task
            });
        }
    }
    for (const workflow of workflowsWithSchedules){
        for (const schedule of workflow.schedule ?? []){
            ;
            (queuesWithSchedules[schedule.queue] ??= {
                schedules: []
            }).schedules.push({
                scheduleConfig: schedule,
                workflowConfig: workflow
            });
        }
    }
    return queuesWithSchedules;
};

//# sourceMappingURL=getQueuesWithSchedules.js.map