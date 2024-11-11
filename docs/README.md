**simple_micro_batcher** • [**Docs**](globals.md)

***

# SimpleMicroBatcher

A simple micro batcher library for Node.js, written in TypeScript. Allows for generic Job and JobResult types, as well as configuration for queue size and queue interval.

## Quick start
    import  { MicroBatcher, BatchProcessor, JobResult, Job } from "simple_micro_batcher";

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
