[**simple_micro_batcher**](../README.md) • **Docs**

***

[simple_micro_batcher](../globals.md) / MicroBatcher

# Class: MicroBatcher\<JobType, JobResultType\>

## Type Parameters

• **JobType** = [`Job`](../type-aliases/Job.md)

• **JobResultType** = [`JobResult`](../type-aliases/JobResult.md)

## Constructors

### new MicroBatcher()

> **new MicroBatcher**\<`JobType`, `JobResultType`\>(`batchProcessor`, `batchSize`, `batchInterval`): [`MicroBatcher`](MicroBatcher.md)\<`JobType`, `JobResultType`\>

#### Parameters

• **batchProcessor**: [`BatchProcessor`](../interfaces/BatchProcessor.md)\<`JobType`, `JobResultType`\>

• **batchSize**: `number`

• **batchInterval**: `number`

#### Returns

[`MicroBatcher`](MicroBatcher.md)\<`JobType`, `JobResultType`\>

#### Defined in

index.ts:44

## Methods

### forceShutdown()

> **forceShutdown**(): `void`

#### Returns

`void`

#### Defined in

index.ts:147

***

### processBatch()

> **processBatch**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:83

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:129

***

### start()

> **start**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:60

***

### submitJob()

> **submitJob**(`job`): `Promise`\<`JobResultType`\>

#### Parameters

• **job**: `JobType`

#### Returns

`Promise`\<`JobResultType`\>

#### Defined in

index.ts:69
