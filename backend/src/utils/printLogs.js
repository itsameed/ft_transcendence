function printLogsDate(target) {
    process.stdout.write(target);
    const date = new Date();
    const currentDate = date.toLocaleString();
    console.log(currentDate);
};

export default printLogsDate;