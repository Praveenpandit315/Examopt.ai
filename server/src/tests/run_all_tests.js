// server/src/tests/run_all_tests.js
const { runPhase1Tests } = require('./test_phase1.js');
const { runPhase2And3Tests } = require('./test_phase2_3.js');
const { runDataHubTests } = require('./test_data_hub.js');
const { runCrossDeptClashTests } = require('./test_cross_dept_clash.js');
const { runSessionBuilderTests } = require('./test_session_builder.js');
const { testFullWorkflow } = require('./test_full_workflow.js');
const { testAICopilot } = require('./test_ai_copilot.js');

async function runAll() {
  console.log('🏁 EXAMOPT AI — MASTER TEST SUITE RUNNER');
  console.log('====================================================\n');
  
  await runPhase1Tests();
  await runPhase2And3Tests();
  await runDataHubTests();
  await runCrossDeptClashTests();
  await runSessionBuilderTests();
  await testFullWorkflow();
  await testAICopilot();

  console.log('\n====================================================');
  console.log('🏆 ALL 7 MASTER TEST SUITES EXECUTED AND PASSED CLEANLY! 🚀');
  console.log('====================================================');
}

runAll().catch(err => {
  console.error('Master test suite failed:', err);
  process.exit(1);
});
