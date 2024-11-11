// Default types provided
type JobDataType<T = any> = T;

export type Job<T = any> = {
    data: JobDataType<T>;
};

export type JobResult = {
    status: string | number;
    message: string;
};

// User defined batch processor that requires a Job and JobResult type
export interface BatchProcessor<JobType = Job, JobResultType = JobResult> {
    process(jobs: JobType[]): Promise<JobResultType[]>;
}

// Micro batcher class with JobType and JobResultType set to the default types
export class MicroBatcher<JobType = Job, JobResultType = JobResult> {
    // User defined batch processor
    private batchProcessor: BatchProcessor<JobType, JobResultType>;
    // Maximum batch size to set. If the job queue reaches this size it will
    // process the jobs immediately.
    private batchSize: number;
    // Batch processing interval. If the interval reaches zero, the batch is
    // processed.
    private batchInterval: number;

    // Job queue of the user defined JobType
    private jobQueue: Array<{
        job: JobType;
        resolve: (result: JobResultType) => void;
        reject: (error: any) => void;
    }>;

    // Batch interval ID which triggers at the defined batchInterval.
    private batchIntervalId: NodeJS.Timeout | null = null;
    // Internal flag to set when a batch is currently being processed to prevent
    // multiple batches being processed at the same time.
    private isProcessing = false;

    private shuttingDown = false;

    constructor(
        batchProcessor: BatchProcessor<JobType, JobResultType>,
        batchSize: number,
        batchInterval: number,
    ) {
        this.batchProcessor = batchProcessor;
        this.batchSize = batchSize;
        this.batchInterval = batchInterval;

        this.jobQueue = [];

        // Start the micro batcher on creation.
        this.start();
    }

    // Kicks off the micro batcher and sets up the interval timer.
    async start() {
        this.batchIntervalId = setInterval(() => {
            this.processBatch();
        }, this.batchInterval);
    }

    // Submits a job a returns a promise of type JobResultType. If the queue
    // reaches the batch size and isn't currently processing, it will process
    // the batch.
    submitJob(job: JobType): Promise<JobResultType> {
        return new Promise((resolve, reject) => {
            this.jobQueue.push({ job, resolve, reject });

            if (this.jobQueue.length >= this.batchSize && !this.isProcessing) {
                this.processBatch();
            }
        });
    }

    // Process batch function. This is triggered at every batchInterval. If
    // isProcessing is false and the jobQueue length is > 0, it will process a
    // batch. Otherwise if the micro batcher is shutting down, process the
    // remaining batches.
    async processBatch() {
        if (
            (this.isProcessing || this.jobQueue.length == 0) &&
            !this.shuttingDown
        )
            return;

        this.isProcessing = true;

        // Take the next batch of size batchSize for processing.
        const jobsToProcess = this.jobQueue.splice(0, this.batchSize);
        // Extract just the job from the job queue.
        const jobs = jobsToProcess.map(({ job }) => job);

        try {
            // Send the batch off to the batch processor and wait for the
            // results.
            const results = await this.batchProcessor.process(jobs);

            // Update the job promises with the result.
            results.forEach((result, index) =>
                jobsToProcess[index].resolve(result),
            );
        } catch (error) {
            // Update each reject with an error.
            jobsToProcess.forEach(({ reject }) => reject(error));
        } finally {
            // Finished processing.
            this.isProcessing = false;

            // If there are still jobs in the job queue and it's >= to the
            // batchSize, process the next batch.
            if (this.jobQueue.length >= this.batchSize) {
                this.processBatch();
            }

            // If the micro batcher is shutting down, keep processing the
            // batches until all batches are complete.
            if (this.shuttingDown && this.jobQueue.length > 0) {
                this.processBatch();
            }
        }
    }

    // Gracefully handle the shut down logic by waiting for the rest of the
    // queue to be processed.
    async shutdown() {
        this.shuttingDown = true;

        // Clear the batch interval
        if (this.batchIntervalId) {
            clearInterval(this.batchIntervalId);
            this.batchIntervalId = null;
        }

        // If there are jobs in the queue, process them.
        while (this.jobQueue.length > 0) {
            await this.processBatch();
        }

        this.shuttingDown = false;
    }

    // Force the mirco batcher to shut down, ignoring what's in the job queue.
    forceShutdown() {
        // Clear the batch interval
        if (this.batchIntervalId) {
            clearInterval(this.batchIntervalId);
            this.batchIntervalId = null;
        }
    }
}
