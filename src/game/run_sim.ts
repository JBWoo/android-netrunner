import { runQASimulations } from './qa';

console.log('=== Netrunner AI 100 Games QA Simulation ===');
const report = runQASimulations(100);

console.log(`Total Games: ${report.totalGames}`);
console.log(`Corp Wins: ${report.corpWins}`);
console.log(`Runner Wins: ${report.runnerWins}`);
console.log(`- Agenda Wins: ${report.agendaWins}`);
console.log(`- Flatline Wins: ${report.flatlineWins}`);
console.log(`- Deckout Wins: ${report.deckoutWins}`);
console.log(`Deadlocks: ${report.deadlocks}`);
console.log(`Average Turns: ${report.averageTurns}`);
console.log(`Average Steps: ${report.averageSteps}`);
console.log(`Average Corp Credits: ${report.averageCorpCredits}`);
console.log(`Average Runner Credits: ${report.averageRunnerCredits}`);
console.log(`Total Rule Violations: ${report.totalViolations}`);

if (report.totalViolations > 0) {
  console.log('\n--- Rule Violations Summary (up to 15) ---');
  report.violationsSummary.forEach(v => console.log(v));
}
