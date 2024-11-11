# SimpleMicroBatcher

A simple, TypeScript-based micro-batching library for Node.js, designed for asynchronous processing. Supports generic Job and JobResult types, and allows configurable batch size and interval for processing jobs in batches.

## Quick start
    import { MicroBatcher, BatchProcessor, JobResult, Job } from "simple_micro_batcher";

    class MockBatchProcessor implements BatchProcessor<Job, JobResult> {
        async process(jobs: Job[]): Promise<JobResult[]> {
            return jobs.map((job) => ({
                status: "PROCESSED",
                message: `Data Processed: ${ job.data }`,
            }));
        }
    }

    const run = async () => {
        const batchSize = 1;
        const batchInterval = 100;

        const batchProcessor = new MockBatchProcessor();
        const microBatcher = new MicroBatcher(
            batchProcessor,
            batchSize,
            batchInterval,
        );

        const jobs = [
            microBatcher.submitJob({ data: "apple" }),
            microBatcher.submitJob({ data: "banana" }),
        ];

        const results = await Promise.all(jobs);

        console.log(results[0].message);
        console.log(results[1].message);

        await microBatcher.shutdown();
    };

    run();

    Output:

    Data Processed: apple
    Data Processed: banana

The simple micro batcher provides default types for `Job` and `JobResult`, however the library is flexible enough to allow the user to create their own types.

    type MyJob = { size: number; colour: string };
    type MyJobResult = { foo: number; bar: string };

    class MockBatchProcessor implements BatchProcessor<MyJob, MyJobResult> {
        async process(jobs: MyJob[]): Promise<MyJobResult[]> {
            return jobs.map((job) => ({
                foo: job.size,
                bar: `Data Processed: ${ job.colour }`,
            }));
        }
    }

    const batchSize = 1;
    const batchInterval = 100;

    const batchProcessor = new MockBatchProcessor();
    const microBatcher = new MicroBatcher<MyJob, MyJobResult>(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ size: 9, colour: "green" }),
        microBatcher.submitJob({ size: 36, colour: "prussian blue" }),
    ];

    const results = await Promise.all(jobs);

    etc...

API documentation is available inside `docs/`.

Run tests with `npm run test`.