import { MicroBatcher, BatchProcessor, JobResult, Job } from "../src/index";

enum JobState {
    PROCESSED,
    ERROR,
}

class MockBatchProcessor implements BatchProcessor<Job, JobResult> {
    async process(jobs: Job[]): Promise<JobResult[]> {
        return jobs.map(() => ({
            status: JobState.PROCESSED,
            message: "Job successfully processed.",
        }));
    }
}

test("Receive JobResult From Batch Processing", async () => {
    const batchSize = 3;
    const batchInterval = 100;

    const batchProcessor = new MockBatchProcessor();
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [microBatcher.submitJob({ data: "apple" })];

    const [appleJob] = await Promise.all(jobs);

    await microBatcher.shutdown();

    const expectedJobResult: JobResult = {
        status: JobState.PROCESSED,
        message: "Job successfully processed.",
    };

    expect(appleJob).toEqual(expectedJobResult);
});

test("Custom Job and JobResult", async () => {
    type MyJob = { size: number; colour: string };
    type MyJobResult = { combination: string; height: number };

    const batchSize = 3;
    const batchInterval = 100;

    const mockProcess = jest.fn((jobs: MyJob[]): Promise<MyJobResult[]> => {
        return Promise.resolve(
            jobs.map((job) => ({
                combination: job.size + job.colour,
                height: job.size * 2,
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher<MyJob, MyJobResult>(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [microBatcher.submitJob({ size: 4, colour: "green" })];

    const [appleJob] = await Promise.all(jobs);

    await microBatcher.shutdown();

    const expectedJobResult: MyJobResult = {
        combination: "4green",
        height: 8,
    };

    expect(appleJob).toEqual(expectedJobResult);
});

test("Process Batch When Size Limit Reached", async () => {
    const batchSize = 3;
    const batchInterval = 10000;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map(() => ({
                status: JobState.PROCESSED,
                message: "Job successfully processed.",
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ data: "apple" }),
        microBatcher.submitJob({ data: "banana" }),
        microBatcher.submitJob({ data: "cherry" }),
    ];

    await Promise.all(jobs);

    await microBatcher.shutdown();

    expect(mockProcess).toHaveBeenCalledTimes(1);

    expect(mockProcess).toHaveBeenCalledWith([
        { data: "apple" },
        { data: "banana" },
        { data: "cherry" },
    ]);
});

test("Process Batch When Size Limit Reached Twice", async () => {
    const batchSize = 3;
    const batchInterval = 10000;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map(() => ({
                status: JobState.PROCESSED,
                message: "Job successfully processed.",
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ data: "apple" }),
        microBatcher.submitJob({ data: "banana" }),
        microBatcher.submitJob({ data: "cherry" }),
        microBatcher.submitJob({ data: "durian" }),
        microBatcher.submitJob({ data: "elderberry" }),
        microBatcher.submitJob({ data: "fig" }),
    ];

    await Promise.all(jobs);

    await microBatcher.shutdown();

    expect(mockProcess).toHaveBeenCalledTimes(2);

    expect(mockProcess).toHaveBeenNthCalledWith(1, [
        { data: "apple" },
        { data: "banana" },
        { data: "cherry" },
    ]);

    expect(mockProcess).toHaveBeenNthCalledWith(2, [
        { data: "durian" },
        { data: "elderberry" },
        { data: "fig" },
    ]);
});

test("Process Batch When Time Limit Reached", async () => {
    const batchSize = 1000;
    const batchInterval = 100;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map(() => ({
                status: JobState.PROCESSED,
                message: "Job successfully processed.",
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ data: "apple" }),
        microBatcher.submitJob({ data: "banana" }),
        microBatcher.submitJob({ data: "cherry" }),
    ];

    // Wait twice as long as the batchInterval, to ensure the batch interval timer has been triggered
    await new Promise((resolve) => setTimeout(resolve, batchInterval * 2));

    await microBatcher.shutdown();

    expect(mockProcess).toHaveBeenCalledTimes(1);

    expect(mockProcess).toHaveBeenCalledWith([
        { data: "apple" },
        { data: "banana" },
        { data: "cherry" },
    ]);
});

test("Jobs Are Processed In Order", async () => {
    const batchSize = 3;
    const batchInterval = 10000;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map((job) => ({
                status: JobState.PROCESSED,
                message: job.data,
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ data: "apple" }),
        microBatcher.submitJob({ data: "banana" }),
        microBatcher.submitJob({ data: "cherry" }),
    ];

    const results = await Promise.all(jobs);

    await microBatcher.shutdown();

    expect(mockProcess).toHaveBeenCalledTimes(1);

    expect(results[0].message).toBe("apple");
    expect(results[1].message).toBe("banana");
    expect(results[2].message).toBe("cherry");
});

test("No Processing Occurs", async () => {
    const batchSize = 1000;
    const batchInterval = 500;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map(() => ({
                status: JobState.PROCESSED,
                message: "Job successfully processed.",
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ data: "apple" }),
        microBatcher.submitJob({ data: "banana" }),
        microBatcher.submitJob({ data: "cherry" }),
    ];

    // Wait half as long as the batch interval before shutting down.
    await new Promise((resolve) => setTimeout(resolve, batchInterval / 2));

    expect(mockProcess).toHaveBeenCalledTimes(0);

    await microBatcher.shutdown();
});

test("Process Remaining Jobs On Shutdown", async () => {
    const batchSize = 2;
    const batchInterval = 10000;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map(() => ({
                status: JobState.PROCESSED,
                message: "Job successfully processed.",
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ data: "apple" }),
        microBatcher.submitJob({ data: "banana" }),
        microBatcher.submitJob({ data: "cherry" }),
    ];

    await new Promise((resolve) => setTimeout(resolve, 100));

    await microBatcher.shutdown();

    expect(mockProcess).toHaveBeenCalledTimes(2);

    expect(mockProcess).toHaveBeenNthCalledWith(1, [
        { data: "apple" },
        { data: "banana" },
    ]);
    expect(mockProcess).toHaveBeenNthCalledWith(2, [{ data: "cherry" }]);
});

test("Process Remaining Jobs On Shutdown When Batch Size Is Not Met", async () => {
    const batchSize = 1000;
    const batchInterval = 10000;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map(() => ({
                status: JobState.PROCESSED,
                message: "Job successfully processed.",
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const job = microBatcher.submitJob({ data: "apple" });

    await new Promise((resolve) => setTimeout(resolve, 100));

    await microBatcher.shutdown();

    expect(mockProcess).toHaveBeenCalledTimes(1);

    expect(mockProcess).toHaveBeenCalledWith([{ data: "apple" }]);

    const jobResult = await job;

    expect(jobResult.status).toBe(JobState.PROCESSED);
    expect(jobResult.message).toBe("Job successfully processed.");
});

test("Force Shutdown And Ignore Jobs In Queue", async () => {
    const batchSize = 10;
    const batchInterval = 10000;

    const mockProcess = jest.fn((jobs: Job[]) => {
        return Promise.resolve(
            jobs.map(() => ({
                status: JobState.PROCESSED,
                message: "Job successfully processed.",
            })),
        );
    });

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const jobs = [
        microBatcher.submitJob({ data: "apple" }),
        microBatcher.submitJob({ data: "banana" }),
        microBatcher.submitJob({ data: "cherry" }),
    ];

    await new Promise((resolve) => setTimeout(resolve, 100));

    microBatcher.forceShutdown();

    expect(mockProcess).toHaveBeenCalledTimes(0);
});

test("Jobs Receive Rejection On Failure", async () => {
    const batchSize = 10;
    const batchInterval = 500;

    const errorMessage = "Batch processing failed";
    const mockProcess = jest.fn().mockRejectedValue(new Error(errorMessage));

    const batchProcessor = { process: mockProcess };
    const microBatcher = new MicroBatcher(
        batchProcessor,
        batchSize,
        batchInterval,
    );

    const appleJob = microBatcher.submitJob({ data: "apple" });
    const bananaJob = microBatcher.submitJob({ data: "banana" });

    await expect(appleJob).rejects.toThrow(errorMessage);
    await expect(bananaJob).rejects.toThrow(errorMessage);

    await microBatcher.shutdown();
});
