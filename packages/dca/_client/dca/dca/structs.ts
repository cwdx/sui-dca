/**
 * @title DCA Module
 * @notice DCA with GlobalConfig integration for upgradable protocol settings.
 * @dev Fee and executor reward settings are snapshotted at account creation time.
 * Trade execution is PERMISSIONLESS - anyone can trigger trades when time conditions are met.
 * This enables keeper networks and removes single-point-of-failure on delegatee.
 */

import { bcs } from '@mysten/sui/bcs'
import { SuiObjectData, SuiParsedData } from '@mysten/sui/client'
import { fromBase64, fromHex, toHex } from '@mysten/sui/utils'
import { Option } from '../../_dependencies/std/option/structs'
import { Balance } from '../../_dependencies/sui/balance/structs'
import { ID, UID } from '../../_dependencies/sui/object/structs'
import { SUI } from '../../_dependencies/sui/sui/structs'
import { getTypeOrigin } from '../../_envs'
import {
  assertFieldsWithTypesArgsMatch,
  assertReifiedTypeArgsMatch,
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  extractType,
  fieldToJSON,
  phantom,
  PhantomReified,
  PhantomToTypeStr,
  PhantomTypeArgument,
  Reified,
  StructClass,
  ToField,
  ToJSON,
  ToPhantomTypeArgument,
  ToTypeStr,
  ToTypeStr as ToPhantom,
} from '../../_framework/reified'
import {
  composeSuiType,
  compressSuiType,
  fetchObjectBcs,
  FieldsWithTypes,
  parseTypeName,
  SupportedSuiClient,
} from '../../_framework/util'
import { ConfigSnapshot } from '../config/structs'

/* ============================== TradePromise =============================== */

export function isTradePromise(type: string): boolean {
  type = compressSuiType(type)
  return type.startsWith(`${getTypeOrigin('dca', 'dca::TradePromise')}::dca::TradePromise` + '<')
}

export interface TradePromiseFields<
  Input extends PhantomTypeArgument,
  Output extends PhantomTypeArgument,
> {
  input: ToField<'u64'>
  minOutput: ToField<'u64'>
  dcaId: ToField<ID>
}

export type TradePromiseReified<
  Input extends PhantomTypeArgument,
  Output extends PhantomTypeArgument,
> = Reified<TradePromise<Input, Output>, TradePromiseFields<Input, Output>>

export type TradePromiseJSONField<
  Input extends PhantomTypeArgument,
  Output extends PhantomTypeArgument,
> = {
  input: string
  minOutput: string
  dcaId: string
}

export type TradePromiseJSON<
  Input extends PhantomTypeArgument,
  Output extends PhantomTypeArgument,
> = {
  $typeName: typeof TradePromise.$typeName
  $typeArgs: [PhantomToTypeStr<Input>, PhantomToTypeStr<Output>]
} & TradePromiseJSONField<Input, Output>

export class TradePromise<Input extends PhantomTypeArgument, Output extends PhantomTypeArgument>
  implements StructClass
{
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::TradePromise` = `${
    getTypeOrigin('dca', 'dca::TradePromise')
  }::dca::TradePromise` as const
  static readonly $numTypeParams = 2
  static readonly $isPhantom = [true, true] as const

  readonly $typeName: typeof TradePromise.$typeName = TradePromise.$typeName
  readonly $fullTypeName: `${string}::dca::TradePromise<${PhantomToTypeStr<
    Input
  >}, ${PhantomToTypeStr<Output>}>`
  readonly $typeArgs: [PhantomToTypeStr<Input>, PhantomToTypeStr<Output>]
  readonly $isPhantom: typeof TradePromise.$isPhantom = TradePromise.$isPhantom

  readonly input: ToField<'u64'>
  readonly minOutput: ToField<'u64'>
  readonly dcaId: ToField<ID>

  private constructor(
    typeArgs: [PhantomToTypeStr<Input>, PhantomToTypeStr<Output>],
    fields: TradePromiseFields<Input, Output>,
  ) {
    this.$fullTypeName = composeSuiType(
      TradePromise.$typeName,
      ...typeArgs,
    ) as `${string}::dca::TradePromise<${PhantomToTypeStr<Input>}, ${PhantomToTypeStr<Output>}>`
    this.$typeArgs = typeArgs

    this.input = fields.input
    this.minOutput = fields.minOutput
    this.dcaId = fields.dcaId
  }

  static reified<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    Input: Input,
    Output: Output,
  ): TradePromiseReified<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    const reifiedBcs = TradePromise.bcs
    return {
      typeName: TradePromise.$typeName,
      fullTypeName: composeSuiType(
        TradePromise.$typeName,
        ...[extractType(Input), extractType(Output)],
      ) as `${string}::dca::TradePromise<${PhantomToTypeStr<
        ToPhantomTypeArgument<Input>
      >}, ${PhantomToTypeStr<ToPhantomTypeArgument<Output>>}>`,
      typeArgs: [extractType(Input), extractType(Output)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<Input>>,
        PhantomToTypeStr<ToPhantomTypeArgument<Output>>,
      ],
      isPhantom: TradePromise.$isPhantom,
      reifiedTypeArgs: [Input, Output],
      fromFields: (fields: Record<string, any>) => TradePromise.fromFields([Input, Output], fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        TradePromise.fromFieldsWithTypes([Input, Output], item),
      fromBcs: (data: Uint8Array) =>
        TradePromise.fromFields([Input, Output], reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TradePromise.fromJSONField([Input, Output], field),
      fromJSON: (json: Record<string, any>) => TradePromise.fromJSON([Input, Output], json),
      fromSuiParsedData: (content: SuiParsedData) =>
        TradePromise.fromSuiParsedData([Input, Output], content),
      fromSuiObjectData: (content: SuiObjectData) =>
        TradePromise.fromSuiObjectData([Input, Output], content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        TradePromise.fetch(client, [Input, Output], id),
      new: (
        fields: TradePromiseFields<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>>,
      ) => {
        return new TradePromise([extractType(Input), extractType(Output)], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): typeof TradePromise.reified {
    return TradePromise.reified
  }

  static phantom<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    Input: Input,
    Output: Output,
  ): PhantomReified<
    ToTypeStr<TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>>>
  > {
    return phantom(TradePromise.reified(Input, Output))
  }

  static get p(): typeof TradePromise.phantom {
    return TradePromise.phantom
  }

  private static instantiateBcs() {
    return bcs.struct('TradePromise', {
      input: bcs.u64(),
      min_output: bcs.u64(),
      dca_id: ID.bcs,
    })
  }

  private static cachedBcs: ReturnType<typeof TradePromise.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof TradePromise.instantiateBcs> {
    if (!TradePromise.cachedBcs) {
      TradePromise.cachedBcs = TradePromise.instantiateBcs()
    }
    return TradePromise.cachedBcs
  }

  static fromFields<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    fields: Record<string, any>,
  ): TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    return TradePromise.reified(typeArgs[0], typeArgs[1]).new({
      input: decodeFromFields('u64', fields.input),
      minOutput: decodeFromFields('u64', fields.min_output),
      dcaId: decodeFromFields(ID.reified(), fields.dca_id),
    })
  }

  static fromFieldsWithTypes<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    item: FieldsWithTypes,
  ): TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (!isTradePromise(item.type)) {
      throw new Error('not a TradePromise type')
    }
    assertFieldsWithTypesArgsMatch(item, typeArgs)

    return TradePromise.reified(typeArgs[0], typeArgs[1]).new({
      input: decodeFromFieldsWithTypes('u64', item.fields.input),
      minOutput: decodeFromFieldsWithTypes('u64', item.fields.min_output),
      dcaId: decodeFromFieldsWithTypes(ID.reified(), item.fields.dca_id),
    })
  }

  static fromBcs<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    data: Uint8Array,
  ): TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    return TradePromise.fromFields(typeArgs, TradePromise.bcs.parse(data))
  }

  toJSONField(): TradePromiseJSONField<Input, Output> {
    return {
      input: this.input.toString(),
      minOutput: this.minOutput.toString(),
      dcaId: this.dcaId,
    }
  }

  toJSON(): TradePromiseJSON<Input, Output> {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    field: any,
  ): TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    return TradePromise.reified(typeArgs[0], typeArgs[1]).new({
      input: decodeFromJSONField('u64', field.input),
      minOutput: decodeFromJSONField('u64', field.minOutput),
      dcaId: decodeFromJSONField(ID.reified(), field.dcaId),
    })
  }

  static fromJSON<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    json: Record<string, any>,
  ): TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (json.$typeName !== TradePromise.$typeName) {
      throw new Error(
        `not a TradePromise json object: expected '${TradePromise.$typeName}' but got '${json.$typeName}'`,
      )
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(TradePromise.$typeName, ...typeArgs.map(extractType)),
      json.$typeArgs,
      typeArgs,
    )

    return TradePromise.fromJSONField(typeArgs, json)
  }

  static fromSuiParsedData<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    content: SuiParsedData,
  ): TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTradePromise(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a TradePromise object`)
    }
    return TradePromise.fromFieldsWithTypes(typeArgs, content)
  }

  static fromSuiObjectData<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    data: SuiObjectData,
  ): TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTradePromise(data.bcs.type)) {
        throw new Error(`object at is not a TradePromise object`)
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs
      if (gotTypeArgs.length !== 2) {
        throw new Error(
          `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
        )
      }
      for (let i = 0; i < 2; i++) {
        const gotTypeArg = compressSuiType(gotTypeArgs[i])
        const expectedTypeArg = compressSuiType(extractType(typeArgs[i]))
        if (gotTypeArg !== expectedTypeArg) {
          throw new Error(
            `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
          )
        }
      }

      return TradePromise.fromBcs(typeArgs, fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TradePromise.fromSuiParsedData(typeArgs, data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    client: SupportedSuiClient,
    typeArgs: [Input, Output],
    id: string,
  ): Promise<TradePromise<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>>> {
    const res = await fetchObjectBcs(client, id)
    if (!isTradePromise(res.type)) {
      throw new Error(`object at id ${id} is not a TradePromise object`)
    }

    const gotTypeArgs = parseTypeName(res.type).typeArgs
    if (gotTypeArgs.length !== 2) {
      throw new Error(
        `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
      )
    }
    for (let i = 0; i < 2; i++) {
      const gotTypeArg = compressSuiType(gotTypeArgs[i])
      const expectedTypeArg = compressSuiType(extractType(typeArgs[i]))
      if (gotTypeArg !== expectedTypeArg) {
        throw new Error(
          `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        )
      }
    }

    return TradePromise.fromBcs(typeArgs, res.bcsBytes)
  }
}

/* ============================== Price =============================== */

export function isPrice(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'dca::Price')}::dca::Price`
}

export interface PriceFields {
  baseVal: ToField<'u64'>
  quoteVal: ToField<'u64'>
}

export type PriceReified = Reified<Price, PriceFields>

export type PriceJSONField = {
  baseVal: string
  quoteVal: string
}

export type PriceJSON = {
  $typeName: typeof Price.$typeName
  $typeArgs: []
} & PriceJSONField

export class Price implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::Price` = `${
    getTypeOrigin('dca', 'dca::Price')
  }::dca::Price` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof Price.$typeName = Price.$typeName
  readonly $fullTypeName: `${string}::dca::Price`
  readonly $typeArgs: []
  readonly $isPhantom: typeof Price.$isPhantom = Price.$isPhantom

  readonly baseVal: ToField<'u64'>
  readonly quoteVal: ToField<'u64'>

  private constructor(typeArgs: [], fields: PriceFields) {
    this.$fullTypeName = composeSuiType(
      Price.$typeName,
      ...typeArgs,
    ) as `${string}::dca::Price`
    this.$typeArgs = typeArgs

    this.baseVal = fields.baseVal
    this.quoteVal = fields.quoteVal
  }

  static reified(): PriceReified {
    const reifiedBcs = Price.bcs
    return {
      typeName: Price.$typeName,
      fullTypeName: composeSuiType(
        Price.$typeName,
        ...[],
      ) as `${string}::dca::Price`,
      typeArgs: [] as [],
      isPhantom: Price.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => Price.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => Price.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => Price.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => Price.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => Price.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => Price.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => Price.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => Price.fetch(client, id),
      new: (fields: PriceFields) => {
        return new Price([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): PriceReified {
    return Price.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<Price>> {
    return phantom(Price.reified())
  }

  static get p(): PhantomReified<ToTypeStr<Price>> {
    return Price.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('Price', {
      base_val: bcs.u64(),
      quote_val: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof Price.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof Price.instantiateBcs> {
    if (!Price.cachedBcs) {
      Price.cachedBcs = Price.instantiateBcs()
    }
    return Price.cachedBcs
  }

  static fromFields(fields: Record<string, any>): Price {
    return Price.reified().new({
      baseVal: decodeFromFields('u64', fields.base_val),
      quoteVal: decodeFromFields('u64', fields.quote_val),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): Price {
    if (!isPrice(item.type)) {
      throw new Error('not a Price type')
    }

    return Price.reified().new({
      baseVal: decodeFromFieldsWithTypes('u64', item.fields.base_val),
      quoteVal: decodeFromFieldsWithTypes('u64', item.fields.quote_val),
    })
  }

  static fromBcs(data: Uint8Array): Price {
    return Price.fromFields(Price.bcs.parse(data))
  }

  toJSONField(): PriceJSONField {
    return {
      baseVal: this.baseVal.toString(),
      quoteVal: this.quoteVal.toString(),
    }
  }

  toJSON(): PriceJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): Price {
    return Price.reified().new({
      baseVal: decodeFromJSONField('u64', field.baseVal),
      quoteVal: decodeFromJSONField('u64', field.quoteVal),
    })
  }

  static fromJSON(json: Record<string, any>): Price {
    if (json.$typeName !== Price.$typeName) {
      throw new Error(
        `not a Price json object: expected '${Price.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return Price.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): Price {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isPrice(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a Price object`)
    }
    return Price.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): Price {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isPrice(data.bcs.type)) {
        throw new Error(`object at is not a Price object`)
      }

      return Price.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return Price.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<Price> {
    const res = await fetchObjectBcs(client, id)
    if (!isPrice(res.type)) {
      throw new Error(`object at id ${id} is not a Price object`)
    }

    return Price.fromBcs(res.bcsBytes)
  }
}

/* ============================== TradeParams =============================== */

export function isTradeParams(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'dca::TradeParams')}::dca::TradeParams`
}

export interface TradeParamsFields {
  minPrice: ToField<Option<Price>>
  maxPrice: ToField<Option<Price>>
  /** Custom slippage tolerance in basis points (overrides default if set) */
  slippageBps: ToField<Option<'u64'>>
}

export type TradeParamsReified = Reified<TradeParams, TradeParamsFields>

export type TradeParamsJSONField = {
  minPrice: ToJSON<Price> | null
  maxPrice: ToJSON<Price> | null
  slippageBps: string | null
}

export type TradeParamsJSON = {
  $typeName: typeof TradeParams.$typeName
  $typeArgs: []
} & TradeParamsJSONField

export class TradeParams implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::TradeParams` = `${
    getTypeOrigin('dca', 'dca::TradeParams')
  }::dca::TradeParams` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof TradeParams.$typeName = TradeParams.$typeName
  readonly $fullTypeName: `${string}::dca::TradeParams`
  readonly $typeArgs: []
  readonly $isPhantom: typeof TradeParams.$isPhantom = TradeParams.$isPhantom

  readonly minPrice: ToField<Option<Price>>
  readonly maxPrice: ToField<Option<Price>>
  /** Custom slippage tolerance in basis points (overrides default if set) */
  readonly slippageBps: ToField<Option<'u64'>>

  private constructor(typeArgs: [], fields: TradeParamsFields) {
    this.$fullTypeName = composeSuiType(
      TradeParams.$typeName,
      ...typeArgs,
    ) as `${string}::dca::TradeParams`
    this.$typeArgs = typeArgs

    this.minPrice = fields.minPrice
    this.maxPrice = fields.maxPrice
    this.slippageBps = fields.slippageBps
  }

  static reified(): TradeParamsReified {
    const reifiedBcs = TradeParams.bcs
    return {
      typeName: TradeParams.$typeName,
      fullTypeName: composeSuiType(
        TradeParams.$typeName,
        ...[],
      ) as `${string}::dca::TradeParams`,
      typeArgs: [] as [],
      isPhantom: TradeParams.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => TradeParams.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => TradeParams.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => TradeParams.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TradeParams.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => TradeParams.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => TradeParams.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => TradeParams.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => TradeParams.fetch(client, id),
      new: (fields: TradeParamsFields) => {
        return new TradeParams([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TradeParamsReified {
    return TradeParams.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<TradeParams>> {
    return phantom(TradeParams.reified())
  }

  static get p(): PhantomReified<ToTypeStr<TradeParams>> {
    return TradeParams.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('TradeParams', {
      min_price: Option.bcs(Price.bcs),
      max_price: Option.bcs(Price.bcs),
      slippage_bps: Option.bcs(bcs.u64()),
    })
  }

  private static cachedBcs: ReturnType<typeof TradeParams.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof TradeParams.instantiateBcs> {
    if (!TradeParams.cachedBcs) {
      TradeParams.cachedBcs = TradeParams.instantiateBcs()
    }
    return TradeParams.cachedBcs
  }

  static fromFields(fields: Record<string, any>): TradeParams {
    return TradeParams.reified().new({
      minPrice: decodeFromFields(Option.reified(Price.reified()), fields.min_price),
      maxPrice: decodeFromFields(Option.reified(Price.reified()), fields.max_price),
      slippageBps: decodeFromFields(Option.reified('u64'), fields.slippage_bps),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TradeParams {
    if (!isTradeParams(item.type)) {
      throw new Error('not a TradeParams type')
    }

    return TradeParams.reified().new({
      minPrice: decodeFromFieldsWithTypes(Option.reified(Price.reified()), item.fields.min_price),
      maxPrice: decodeFromFieldsWithTypes(Option.reified(Price.reified()), item.fields.max_price),
      slippageBps: decodeFromFieldsWithTypes(Option.reified('u64'), item.fields.slippage_bps),
    })
  }

  static fromBcs(data: Uint8Array): TradeParams {
    return TradeParams.fromFields(TradeParams.bcs.parse(data))
  }

  toJSONField(): TradeParamsJSONField {
    return {
      minPrice: fieldToJSON<Option<Price>>(
        `${Option.$typeName}<${Price.$typeName}>`,
        this.minPrice,
      ),
      maxPrice: fieldToJSON<Option<Price>>(
        `${Option.$typeName}<${Price.$typeName}>`,
        this.maxPrice,
      ),
      slippageBps: fieldToJSON<Option<'u64'>>(`${Option.$typeName}<u64>`, this.slippageBps),
    }
  }

  toJSON(): TradeParamsJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): TradeParams {
    return TradeParams.reified().new({
      minPrice: decodeFromJSONField(Option.reified(Price.reified()), field.minPrice),
      maxPrice: decodeFromJSONField(Option.reified(Price.reified()), field.maxPrice),
      slippageBps: decodeFromJSONField(Option.reified('u64'), field.slippageBps),
    })
  }

  static fromJSON(json: Record<string, any>): TradeParams {
    if (json.$typeName !== TradeParams.$typeName) {
      throw new Error(
        `not a TradeParams json object: expected '${TradeParams.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return TradeParams.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): TradeParams {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTradeParams(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a TradeParams object`)
    }
    return TradeParams.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): TradeParams {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTradeParams(data.bcs.type)) {
        throw new Error(`object at is not a TradeParams object`)
      }

      return TradeParams.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TradeParams.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<TradeParams> {
    const res = await fetchObjectBcs(client, id)
    if (!isTradeParams(res.type)) {
      throw new Error(`object at id ${id} is not a TradeParams object`)
    }

    return TradeParams.fromBcs(res.bcsBytes)
  }
}

/* ============================== DCA =============================== */

export function isDCA(type: string): boolean {
  type = compressSuiType(type)
  return type.startsWith(`${getTypeOrigin('dca', 'dca::DCA')}::dca::DCA` + '<')
}

export interface DCAFields<Input extends PhantomTypeArgument, Output extends PhantomTypeArgument> {
  id: ToField<UID>
  version: ToField<'u64'>
  owner: ToField<'address'>
  delegatee: ToField<'address'>
  startTimeMs: ToField<'u64'>
  lastTimeMs: ToField<'u64'>
  every: ToField<'u64'>
  /** Original total orders (for order_number calculation) */
  initialOrders: ToField<'u64'>
  remainingOrders: ToField<'u64'>
  timeScale: ToField<'u8'>
  inputBalance: ToField<Balance<Input>>
  splitAllocation: ToField<'u64'>
  tradeParams: ToField<TradeParams>
  active: ToField<'bool'>
  /** SUI balance for executor rewards */
  executorRewardBalance: ToField<Balance<ToPhantom<SUI>>>
  /** Snapshotted config at account creation */
  configSnapshot: ToField<ConfigSnapshot>
  /** Terms version accepted at account creation */
  acceptedTermsVersion: ToField<'u64'>
  /** Input token decimals for oracle calculations */
  inputDecimals: ToField<'u8'>
  /** Output token decimals for oracle calculations */
  outputDecimals: ToField<'u8'>
}

export type DCAReified<Input extends PhantomTypeArgument, Output extends PhantomTypeArgument> =
  Reified<DCA<Input, Output>, DCAFields<Input, Output>>

export type DCAJSONField<Input extends PhantomTypeArgument, Output extends PhantomTypeArgument> = {
  id: string
  version: string
  owner: string
  delegatee: string
  startTimeMs: string
  lastTimeMs: string
  every: string
  initialOrders: string
  remainingOrders: string
  timeScale: number
  inputBalance: ToJSON<Balance<Input>>
  splitAllocation: string
  tradeParams: ToJSON<TradeParams>
  active: boolean
  executorRewardBalance: ToJSON<Balance<ToPhantom<SUI>>>
  configSnapshot: ToJSON<ConfigSnapshot>
  acceptedTermsVersion: string
  inputDecimals: number
  outputDecimals: number
}

export type DCAJSON<Input extends PhantomTypeArgument, Output extends PhantomTypeArgument> = {
  $typeName: typeof DCA.$typeName
  $typeArgs: [PhantomToTypeStr<Input>, PhantomToTypeStr<Output>]
} & DCAJSONField<Input, Output>

/** DCA account with ConfigSnapshot */
export class DCA<Input extends PhantomTypeArgument, Output extends PhantomTypeArgument>
  implements StructClass
{
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::DCA` = `${
    getTypeOrigin('dca', 'dca::DCA')
  }::dca::DCA` as const
  static readonly $numTypeParams = 2
  static readonly $isPhantom = [true, true] as const

  readonly $typeName: typeof DCA.$typeName = DCA.$typeName
  readonly $fullTypeName: `${string}::dca::DCA<${PhantomToTypeStr<Input>}, ${PhantomToTypeStr<
    Output
  >}>`
  readonly $typeArgs: [PhantomToTypeStr<Input>, PhantomToTypeStr<Output>]
  readonly $isPhantom: typeof DCA.$isPhantom = DCA.$isPhantom

  readonly id: ToField<UID>
  readonly version: ToField<'u64'>
  readonly owner: ToField<'address'>
  readonly delegatee: ToField<'address'>
  readonly startTimeMs: ToField<'u64'>
  readonly lastTimeMs: ToField<'u64'>
  readonly every: ToField<'u64'>
  /** Original total orders (for order_number calculation) */
  readonly initialOrders: ToField<'u64'>
  readonly remainingOrders: ToField<'u64'>
  readonly timeScale: ToField<'u8'>
  readonly inputBalance: ToField<Balance<Input>>
  readonly splitAllocation: ToField<'u64'>
  readonly tradeParams: ToField<TradeParams>
  readonly active: ToField<'bool'>
  /** SUI balance for executor rewards */
  readonly executorRewardBalance: ToField<Balance<ToPhantom<SUI>>>
  /** Snapshotted config at account creation */
  readonly configSnapshot: ToField<ConfigSnapshot>
  /** Terms version accepted at account creation */
  readonly acceptedTermsVersion: ToField<'u64'>
  /** Input token decimals for oracle calculations */
  readonly inputDecimals: ToField<'u8'>
  /** Output token decimals for oracle calculations */
  readonly outputDecimals: ToField<'u8'>

  private constructor(
    typeArgs: [PhantomToTypeStr<Input>, PhantomToTypeStr<Output>],
    fields: DCAFields<Input, Output>,
  ) {
    this.$fullTypeName = composeSuiType(
      DCA.$typeName,
      ...typeArgs,
    ) as `${string}::dca::DCA<${PhantomToTypeStr<Input>}, ${PhantomToTypeStr<Output>}>`
    this.$typeArgs = typeArgs

    this.id = fields.id
    this.version = fields.version
    this.owner = fields.owner
    this.delegatee = fields.delegatee
    this.startTimeMs = fields.startTimeMs
    this.lastTimeMs = fields.lastTimeMs
    this.every = fields.every
    this.initialOrders = fields.initialOrders
    this.remainingOrders = fields.remainingOrders
    this.timeScale = fields.timeScale
    this.inputBalance = fields.inputBalance
    this.splitAllocation = fields.splitAllocation
    this.tradeParams = fields.tradeParams
    this.active = fields.active
    this.executorRewardBalance = fields.executorRewardBalance
    this.configSnapshot = fields.configSnapshot
    this.acceptedTermsVersion = fields.acceptedTermsVersion
    this.inputDecimals = fields.inputDecimals
    this.outputDecimals = fields.outputDecimals
  }

  static reified<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    Input: Input,
    Output: Output,
  ): DCAReified<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    const reifiedBcs = DCA.bcs
    return {
      typeName: DCA.$typeName,
      fullTypeName: composeSuiType(
        DCA.$typeName,
        ...[extractType(Input), extractType(Output)],
      ) as `${string}::dca::DCA<${PhantomToTypeStr<
        ToPhantomTypeArgument<Input>
      >}, ${PhantomToTypeStr<ToPhantomTypeArgument<Output>>}>`,
      typeArgs: [extractType(Input), extractType(Output)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<Input>>,
        PhantomToTypeStr<ToPhantomTypeArgument<Output>>,
      ],
      isPhantom: DCA.$isPhantom,
      reifiedTypeArgs: [Input, Output],
      fromFields: (fields: Record<string, any>) => DCA.fromFields([Input, Output], fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        DCA.fromFieldsWithTypes([Input, Output], item),
      fromBcs: (data: Uint8Array) => DCA.fromFields([Input, Output], reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => DCA.fromJSONField([Input, Output], field),
      fromJSON: (json: Record<string, any>) => DCA.fromJSON([Input, Output], json),
      fromSuiParsedData: (content: SuiParsedData) =>
        DCA.fromSuiParsedData([Input, Output], content),
      fromSuiObjectData: (content: SuiObjectData) =>
        DCA.fromSuiObjectData([Input, Output], content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        DCA.fetch(client, [Input, Output], id),
      new: (fields: DCAFields<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>>) => {
        return new DCA([extractType(Input), extractType(Output)], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): typeof DCA.reified {
    return DCA.reified
  }

  static phantom<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    Input: Input,
    Output: Output,
  ): PhantomReified<ToTypeStr<DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>>>> {
    return phantom(DCA.reified(Input, Output))
  }

  static get p(): typeof DCA.phantom {
    return DCA.phantom
  }

  private static instantiateBcs() {
    return bcs.struct('DCA', {
      id: UID.bcs,
      version: bcs.u64(),
      owner: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      delegatee: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      start_time_ms: bcs.u64(),
      last_time_ms: bcs.u64(),
      every: bcs.u64(),
      initial_orders: bcs.u64(),
      remaining_orders: bcs.u64(),
      time_scale: bcs.u8(),
      input_balance: Balance.bcs,
      split_allocation: bcs.u64(),
      trade_params: TradeParams.bcs,
      active: bcs.bool(),
      executor_reward_balance: Balance.bcs,
      config_snapshot: ConfigSnapshot.bcs,
      accepted_terms_version: bcs.u64(),
      input_decimals: bcs.u8(),
      output_decimals: bcs.u8(),
    })
  }

  private static cachedBcs: ReturnType<typeof DCA.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof DCA.instantiateBcs> {
    if (!DCA.cachedBcs) {
      DCA.cachedBcs = DCA.instantiateBcs()
    }
    return DCA.cachedBcs
  }

  static fromFields<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    fields: Record<string, any>,
  ): DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    return DCA.reified(typeArgs[0], typeArgs[1]).new({
      id: decodeFromFields(UID.reified(), fields.id),
      version: decodeFromFields('u64', fields.version),
      owner: decodeFromFields('address', fields.owner),
      delegatee: decodeFromFields('address', fields.delegatee),
      startTimeMs: decodeFromFields('u64', fields.start_time_ms),
      lastTimeMs: decodeFromFields('u64', fields.last_time_ms),
      every: decodeFromFields('u64', fields.every),
      initialOrders: decodeFromFields('u64', fields.initial_orders),
      remainingOrders: decodeFromFields('u64', fields.remaining_orders),
      timeScale: decodeFromFields('u8', fields.time_scale),
      inputBalance: decodeFromFields(Balance.reified(typeArgs[0]), fields.input_balance),
      splitAllocation: decodeFromFields('u64', fields.split_allocation),
      tradeParams: decodeFromFields(TradeParams.reified(), fields.trade_params),
      active: decodeFromFields('bool', fields.active),
      executorRewardBalance: decodeFromFields(
        Balance.reified(phantom(SUI.reified())),
        fields.executor_reward_balance,
      ),
      configSnapshot: decodeFromFields(ConfigSnapshot.reified(), fields.config_snapshot),
      acceptedTermsVersion: decodeFromFields('u64', fields.accepted_terms_version),
      inputDecimals: decodeFromFields('u8', fields.input_decimals),
      outputDecimals: decodeFromFields('u8', fields.output_decimals),
    })
  }

  static fromFieldsWithTypes<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    item: FieldsWithTypes,
  ): DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (!isDCA(item.type)) {
      throw new Error('not a DCA type')
    }
    assertFieldsWithTypesArgsMatch(item, typeArgs)

    return DCA.reified(typeArgs[0], typeArgs[1]).new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      version: decodeFromFieldsWithTypes('u64', item.fields.version),
      owner: decodeFromFieldsWithTypes('address', item.fields.owner),
      delegatee: decodeFromFieldsWithTypes('address', item.fields.delegatee),
      startTimeMs: decodeFromFieldsWithTypes('u64', item.fields.start_time_ms),
      lastTimeMs: decodeFromFieldsWithTypes('u64', item.fields.last_time_ms),
      every: decodeFromFieldsWithTypes('u64', item.fields.every),
      initialOrders: decodeFromFieldsWithTypes('u64', item.fields.initial_orders),
      remainingOrders: decodeFromFieldsWithTypes('u64', item.fields.remaining_orders),
      timeScale: decodeFromFieldsWithTypes('u8', item.fields.time_scale),
      inputBalance: decodeFromFieldsWithTypes(
        Balance.reified(typeArgs[0]),
        item.fields.input_balance,
      ),
      splitAllocation: decodeFromFieldsWithTypes('u64', item.fields.split_allocation),
      tradeParams: decodeFromFieldsWithTypes(TradeParams.reified(), item.fields.trade_params),
      active: decodeFromFieldsWithTypes('bool', item.fields.active),
      executorRewardBalance: decodeFromFieldsWithTypes(
        Balance.reified(phantom(SUI.reified())),
        item.fields.executor_reward_balance,
      ),
      configSnapshot: decodeFromFieldsWithTypes(
        ConfigSnapshot.reified(),
        item.fields.config_snapshot,
      ),
      acceptedTermsVersion: decodeFromFieldsWithTypes('u64', item.fields.accepted_terms_version),
      inputDecimals: decodeFromFieldsWithTypes('u8', item.fields.input_decimals),
      outputDecimals: decodeFromFieldsWithTypes('u8', item.fields.output_decimals),
    })
  }

  static fromBcs<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    data: Uint8Array,
  ): DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    return DCA.fromFields(typeArgs, DCA.bcs.parse(data))
  }

  toJSONField(): DCAJSONField<Input, Output> {
    return {
      id: this.id,
      version: this.version.toString(),
      owner: this.owner,
      delegatee: this.delegatee,
      startTimeMs: this.startTimeMs.toString(),
      lastTimeMs: this.lastTimeMs.toString(),
      every: this.every.toString(),
      initialOrders: this.initialOrders.toString(),
      remainingOrders: this.remainingOrders.toString(),
      timeScale: this.timeScale,
      inputBalance: this.inputBalance.toJSONField(),
      splitAllocation: this.splitAllocation.toString(),
      tradeParams: this.tradeParams.toJSONField(),
      active: this.active,
      executorRewardBalance: this.executorRewardBalance.toJSONField(),
      configSnapshot: this.configSnapshot.toJSONField(),
      acceptedTermsVersion: this.acceptedTermsVersion.toString(),
      inputDecimals: this.inputDecimals,
      outputDecimals: this.outputDecimals,
    }
  }

  toJSON(): DCAJSON<Input, Output> {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    field: any,
  ): DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    return DCA.reified(typeArgs[0], typeArgs[1]).new({
      id: decodeFromJSONField(UID.reified(), field.id),
      version: decodeFromJSONField('u64', field.version),
      owner: decodeFromJSONField('address', field.owner),
      delegatee: decodeFromJSONField('address', field.delegatee),
      startTimeMs: decodeFromJSONField('u64', field.startTimeMs),
      lastTimeMs: decodeFromJSONField('u64', field.lastTimeMs),
      every: decodeFromJSONField('u64', field.every),
      initialOrders: decodeFromJSONField('u64', field.initialOrders),
      remainingOrders: decodeFromJSONField('u64', field.remainingOrders),
      timeScale: decodeFromJSONField('u8', field.timeScale),
      inputBalance: decodeFromJSONField(Balance.reified(typeArgs[0]), field.inputBalance),
      splitAllocation: decodeFromJSONField('u64', field.splitAllocation),
      tradeParams: decodeFromJSONField(TradeParams.reified(), field.tradeParams),
      active: decodeFromJSONField('bool', field.active),
      executorRewardBalance: decodeFromJSONField(
        Balance.reified(phantom(SUI.reified())),
        field.executorRewardBalance,
      ),
      configSnapshot: decodeFromJSONField(ConfigSnapshot.reified(), field.configSnapshot),
      acceptedTermsVersion: decodeFromJSONField('u64', field.acceptedTermsVersion),
      inputDecimals: decodeFromJSONField('u8', field.inputDecimals),
      outputDecimals: decodeFromJSONField('u8', field.outputDecimals),
    })
  }

  static fromJSON<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    json: Record<string, any>,
  ): DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (json.$typeName !== DCA.$typeName) {
      throw new Error(
        `not a DCA json object: expected '${DCA.$typeName}' but got '${json.$typeName}'`,
      )
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(DCA.$typeName, ...typeArgs.map(extractType)),
      json.$typeArgs,
      typeArgs,
    )

    return DCA.fromJSONField(typeArgs, json)
  }

  static fromSuiParsedData<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    content: SuiParsedData,
  ): DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isDCA(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a DCA object`)
    }
    return DCA.fromFieldsWithTypes(typeArgs, content)
  }

  static fromSuiObjectData<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [Input, Output],
    data: SuiObjectData,
  ): DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>> {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isDCA(data.bcs.type)) {
        throw new Error(`object at is not a DCA object`)
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs
      if (gotTypeArgs.length !== 2) {
        throw new Error(
          `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
        )
      }
      for (let i = 0; i < 2; i++) {
        const gotTypeArg = compressSuiType(gotTypeArgs[i])
        const expectedTypeArg = compressSuiType(extractType(typeArgs[i]))
        if (gotTypeArg !== expectedTypeArg) {
          throw new Error(
            `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
          )
        }
      }

      return DCA.fromBcs(typeArgs, fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return DCA.fromSuiParsedData(typeArgs, data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch<
    Input extends PhantomReified<PhantomTypeArgument>,
    Output extends PhantomReified<PhantomTypeArgument>,
  >(
    client: SupportedSuiClient,
    typeArgs: [Input, Output],
    id: string,
  ): Promise<DCA<ToPhantomTypeArgument<Input>, ToPhantomTypeArgument<Output>>> {
    const res = await fetchObjectBcs(client, id)
    if (!isDCA(res.type)) {
      throw new Error(`object at id ${id} is not a DCA object`)
    }

    const gotTypeArgs = parseTypeName(res.type).typeArgs
    if (gotTypeArgs.length !== 2) {
      throw new Error(
        `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
      )
    }
    for (let i = 0; i < 2; i++) {
      const gotTypeArg = compressSuiType(gotTypeArgs[i])
      const expectedTypeArg = compressSuiType(extractType(typeArgs[i]))
      if (gotTypeArg !== expectedTypeArg) {
        throw new Error(
          `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        )
      }
    }

    return DCA.fromBcs(typeArgs, res.bcsBytes)
  }
}

/* ============================== DCACreatedEvent =============================== */

export function isDCACreatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'dca::DCACreatedEvent')}::dca::DCACreatedEvent`
}

export interface DCACreatedEventFields {
  id: ToField<ID>
  owner: ToField<'address'>
  delegatee: ToField<'address'>
  /** Total number of orders to execute */
  totalOrders: ToField<'u64'>
  /** Total input amount deposited */
  inputAmount: ToField<'u64'>
  /** Amount allocated per trade (before fees) */
  splitAllocation: ToField<'u64'>
  /** Interval between trades */
  every: ToField<'u64'>
  /** Time scale (0=seconds, 1=minutes, 2=hours, 3=days, 4=weeks, 5=months) */
  timeScale: ToField<'u8'>
  /** Fee rate in basis points (snapshotted at creation) */
  feeBps: ToField<'u64'>
  /** Executor reward per trade in MIST (snapshotted at creation) */
  executorRewardPerTrade: ToField<'u64'>
  /** Default slippage tolerance in basis points */
  defaultSlippageBps: ToField<'u64'>
  /** Account start timestamp in milliseconds */
  startTimeMs: ToField<'u64'>
  /** Terms version accepted at creation */
  acceptedTermsVersion: ToField<'u64'>
}

export type DCACreatedEventReified = Reified<DCACreatedEvent, DCACreatedEventFields>

export type DCACreatedEventJSONField = {
  id: string
  owner: string
  delegatee: string
  totalOrders: string
  inputAmount: string
  splitAllocation: string
  every: string
  timeScale: number
  feeBps: string
  executorRewardPerTrade: string
  defaultSlippageBps: string
  startTimeMs: string
  acceptedTermsVersion: string
}

export type DCACreatedEventJSON = {
  $typeName: typeof DCACreatedEvent.$typeName
  $typeArgs: []
} & DCACreatedEventJSONField

/** Emitted when a new DCA account is created */
export class DCACreatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::DCACreatedEvent` = `${
    getTypeOrigin('dca', 'dca::DCACreatedEvent')
  }::dca::DCACreatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof DCACreatedEvent.$typeName = DCACreatedEvent.$typeName
  readonly $fullTypeName: `${string}::dca::DCACreatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof DCACreatedEvent.$isPhantom = DCACreatedEvent.$isPhantom

  readonly id: ToField<ID>
  readonly owner: ToField<'address'>
  readonly delegatee: ToField<'address'>
  /** Total number of orders to execute */
  readonly totalOrders: ToField<'u64'>
  /** Total input amount deposited */
  readonly inputAmount: ToField<'u64'>
  /** Amount allocated per trade (before fees) */
  readonly splitAllocation: ToField<'u64'>
  /** Interval between trades */
  readonly every: ToField<'u64'>
  /** Time scale (0=seconds, 1=minutes, 2=hours, 3=days, 4=weeks, 5=months) */
  readonly timeScale: ToField<'u8'>
  /** Fee rate in basis points (snapshotted at creation) */
  readonly feeBps: ToField<'u64'>
  /** Executor reward per trade in MIST (snapshotted at creation) */
  readonly executorRewardPerTrade: ToField<'u64'>
  /** Default slippage tolerance in basis points */
  readonly defaultSlippageBps: ToField<'u64'>
  /** Account start timestamp in milliseconds */
  readonly startTimeMs: ToField<'u64'>
  /** Terms version accepted at creation */
  readonly acceptedTermsVersion: ToField<'u64'>

  private constructor(typeArgs: [], fields: DCACreatedEventFields) {
    this.$fullTypeName = composeSuiType(
      DCACreatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::dca::DCACreatedEvent`
    this.$typeArgs = typeArgs

    this.id = fields.id
    this.owner = fields.owner
    this.delegatee = fields.delegatee
    this.totalOrders = fields.totalOrders
    this.inputAmount = fields.inputAmount
    this.splitAllocation = fields.splitAllocation
    this.every = fields.every
    this.timeScale = fields.timeScale
    this.feeBps = fields.feeBps
    this.executorRewardPerTrade = fields.executorRewardPerTrade
    this.defaultSlippageBps = fields.defaultSlippageBps
    this.startTimeMs = fields.startTimeMs
    this.acceptedTermsVersion = fields.acceptedTermsVersion
  }

  static reified(): DCACreatedEventReified {
    const reifiedBcs = DCACreatedEvent.bcs
    return {
      typeName: DCACreatedEvent.$typeName,
      fullTypeName: composeSuiType(
        DCACreatedEvent.$typeName,
        ...[],
      ) as `${string}::dca::DCACreatedEvent`,
      typeArgs: [] as [],
      isPhantom: DCACreatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => DCACreatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => DCACreatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => DCACreatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => DCACreatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => DCACreatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => DCACreatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => DCACreatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => DCACreatedEvent.fetch(client, id),
      new: (fields: DCACreatedEventFields) => {
        return new DCACreatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): DCACreatedEventReified {
    return DCACreatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<DCACreatedEvent>> {
    return phantom(DCACreatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<DCACreatedEvent>> {
    return DCACreatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('DCACreatedEvent', {
      id: ID.bcs,
      owner: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      delegatee: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      total_orders: bcs.u64(),
      input_amount: bcs.u64(),
      split_allocation: bcs.u64(),
      every: bcs.u64(),
      time_scale: bcs.u8(),
      fee_bps: bcs.u64(),
      executor_reward_per_trade: bcs.u64(),
      default_slippage_bps: bcs.u64(),
      start_time_ms: bcs.u64(),
      accepted_terms_version: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof DCACreatedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof DCACreatedEvent.instantiateBcs> {
    if (!DCACreatedEvent.cachedBcs) {
      DCACreatedEvent.cachedBcs = DCACreatedEvent.instantiateBcs()
    }
    return DCACreatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): DCACreatedEvent {
    return DCACreatedEvent.reified().new({
      id: decodeFromFields(ID.reified(), fields.id),
      owner: decodeFromFields('address', fields.owner),
      delegatee: decodeFromFields('address', fields.delegatee),
      totalOrders: decodeFromFields('u64', fields.total_orders),
      inputAmount: decodeFromFields('u64', fields.input_amount),
      splitAllocation: decodeFromFields('u64', fields.split_allocation),
      every: decodeFromFields('u64', fields.every),
      timeScale: decodeFromFields('u8', fields.time_scale),
      feeBps: decodeFromFields('u64', fields.fee_bps),
      executorRewardPerTrade: decodeFromFields('u64', fields.executor_reward_per_trade),
      defaultSlippageBps: decodeFromFields('u64', fields.default_slippage_bps),
      startTimeMs: decodeFromFields('u64', fields.start_time_ms),
      acceptedTermsVersion: decodeFromFields('u64', fields.accepted_terms_version),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): DCACreatedEvent {
    if (!isDCACreatedEvent(item.type)) {
      throw new Error('not a DCACreatedEvent type')
    }

    return DCACreatedEvent.reified().new({
      id: decodeFromFieldsWithTypes(ID.reified(), item.fields.id),
      owner: decodeFromFieldsWithTypes('address', item.fields.owner),
      delegatee: decodeFromFieldsWithTypes('address', item.fields.delegatee),
      totalOrders: decodeFromFieldsWithTypes('u64', item.fields.total_orders),
      inputAmount: decodeFromFieldsWithTypes('u64', item.fields.input_amount),
      splitAllocation: decodeFromFieldsWithTypes('u64', item.fields.split_allocation),
      every: decodeFromFieldsWithTypes('u64', item.fields.every),
      timeScale: decodeFromFieldsWithTypes('u8', item.fields.time_scale),
      feeBps: decodeFromFieldsWithTypes('u64', item.fields.fee_bps),
      executorRewardPerTrade: decodeFromFieldsWithTypes(
        'u64',
        item.fields.executor_reward_per_trade,
      ),
      defaultSlippageBps: decodeFromFieldsWithTypes('u64', item.fields.default_slippage_bps),
      startTimeMs: decodeFromFieldsWithTypes('u64', item.fields.start_time_ms),
      acceptedTermsVersion: decodeFromFieldsWithTypes('u64', item.fields.accepted_terms_version),
    })
  }

  static fromBcs(data: Uint8Array): DCACreatedEvent {
    return DCACreatedEvent.fromFields(DCACreatedEvent.bcs.parse(data))
  }

  toJSONField(): DCACreatedEventJSONField {
    return {
      id: this.id,
      owner: this.owner,
      delegatee: this.delegatee,
      totalOrders: this.totalOrders.toString(),
      inputAmount: this.inputAmount.toString(),
      splitAllocation: this.splitAllocation.toString(),
      every: this.every.toString(),
      timeScale: this.timeScale,
      feeBps: this.feeBps.toString(),
      executorRewardPerTrade: this.executorRewardPerTrade.toString(),
      defaultSlippageBps: this.defaultSlippageBps.toString(),
      startTimeMs: this.startTimeMs.toString(),
      acceptedTermsVersion: this.acceptedTermsVersion.toString(),
    }
  }

  toJSON(): DCACreatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): DCACreatedEvent {
    return DCACreatedEvent.reified().new({
      id: decodeFromJSONField(ID.reified(), field.id),
      owner: decodeFromJSONField('address', field.owner),
      delegatee: decodeFromJSONField('address', field.delegatee),
      totalOrders: decodeFromJSONField('u64', field.totalOrders),
      inputAmount: decodeFromJSONField('u64', field.inputAmount),
      splitAllocation: decodeFromJSONField('u64', field.splitAllocation),
      every: decodeFromJSONField('u64', field.every),
      timeScale: decodeFromJSONField('u8', field.timeScale),
      feeBps: decodeFromJSONField('u64', field.feeBps),
      executorRewardPerTrade: decodeFromJSONField('u64', field.executorRewardPerTrade),
      defaultSlippageBps: decodeFromJSONField('u64', field.defaultSlippageBps),
      startTimeMs: decodeFromJSONField('u64', field.startTimeMs),
      acceptedTermsVersion: decodeFromJSONField('u64', field.acceptedTermsVersion),
    })
  }

  static fromJSON(json: Record<string, any>): DCACreatedEvent {
    if (json.$typeName !== DCACreatedEvent.$typeName) {
      throw new Error(
        `not a DCACreatedEvent json object: expected '${DCACreatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return DCACreatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): DCACreatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isDCACreatedEvent(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a DCACreatedEvent object`)
    }
    return DCACreatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): DCACreatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isDCACreatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a DCACreatedEvent object`)
      }

      return DCACreatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return DCACreatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<DCACreatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isDCACreatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a DCACreatedEvent object`)
    }

    return DCACreatedEvent.fromBcs(res.bcsBytes)
  }
}

/* ============================== TradeInitiatedEvent =============================== */

export function isTradeInitiatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'dca::TradeInitiatedEvent')}::dca::TradeInitiatedEvent`
}

export interface TradeInitiatedEventFields {
  dcaId: ToField<ID>
  /** Address that triggered the trade (for keeper tracking) */
  executor: ToField<'address'>
  /** Input amount sent to DEX (after fee deduction) */
  inputAmount: ToField<'u64'>
  /** Fee amount deducted and sent to treasury */
  feeAmount: ToField<'u64'>
  /** Orders remaining after this trade */
  remainingOrders: ToField<'u64'>
  /** Which order number this is (1-indexed) */
  orderNumber: ToField<'u64'>
  /** Minimum output expected (for slippage protection) */
  minOutput: ToField<'u64'>
}

export type TradeInitiatedEventReified = Reified<TradeInitiatedEvent, TradeInitiatedEventFields>

export type TradeInitiatedEventJSONField = {
  dcaId: string
  executor: string
  inputAmount: string
  feeAmount: string
  remainingOrders: string
  orderNumber: string
  minOutput: string
}

export type TradeInitiatedEventJSON = {
  $typeName: typeof TradeInitiatedEvent.$typeName
  $typeArgs: []
} & TradeInitiatedEventJSONField

/** Emitted when init_trade is called (trade initiated) */
export class TradeInitiatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::TradeInitiatedEvent` = `${
    getTypeOrigin('dca', 'dca::TradeInitiatedEvent')
  }::dca::TradeInitiatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof TradeInitiatedEvent.$typeName = TradeInitiatedEvent.$typeName
  readonly $fullTypeName: `${string}::dca::TradeInitiatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof TradeInitiatedEvent.$isPhantom = TradeInitiatedEvent.$isPhantom

  readonly dcaId: ToField<ID>
  /** Address that triggered the trade (for keeper tracking) */
  readonly executor: ToField<'address'>
  /** Input amount sent to DEX (after fee deduction) */
  readonly inputAmount: ToField<'u64'>
  /** Fee amount deducted and sent to treasury */
  readonly feeAmount: ToField<'u64'>
  /** Orders remaining after this trade */
  readonly remainingOrders: ToField<'u64'>
  /** Which order number this is (1-indexed) */
  readonly orderNumber: ToField<'u64'>
  /** Minimum output expected (for slippage protection) */
  readonly minOutput: ToField<'u64'>

  private constructor(typeArgs: [], fields: TradeInitiatedEventFields) {
    this.$fullTypeName = composeSuiType(
      TradeInitiatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::dca::TradeInitiatedEvent`
    this.$typeArgs = typeArgs

    this.dcaId = fields.dcaId
    this.executor = fields.executor
    this.inputAmount = fields.inputAmount
    this.feeAmount = fields.feeAmount
    this.remainingOrders = fields.remainingOrders
    this.orderNumber = fields.orderNumber
    this.minOutput = fields.minOutput
  }

  static reified(): TradeInitiatedEventReified {
    const reifiedBcs = TradeInitiatedEvent.bcs
    return {
      typeName: TradeInitiatedEvent.$typeName,
      fullTypeName: composeSuiType(
        TradeInitiatedEvent.$typeName,
        ...[],
      ) as `${string}::dca::TradeInitiatedEvent`,
      typeArgs: [] as [],
      isPhantom: TradeInitiatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => TradeInitiatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => TradeInitiatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => TradeInitiatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TradeInitiatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => TradeInitiatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => TradeInitiatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => TradeInitiatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        TradeInitiatedEvent.fetch(client, id),
      new: (fields: TradeInitiatedEventFields) => {
        return new TradeInitiatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TradeInitiatedEventReified {
    return TradeInitiatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<TradeInitiatedEvent>> {
    return phantom(TradeInitiatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<TradeInitiatedEvent>> {
    return TradeInitiatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('TradeInitiatedEvent', {
      dca_id: ID.bcs,
      executor: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      input_amount: bcs.u64(),
      fee_amount: bcs.u64(),
      remaining_orders: bcs.u64(),
      order_number: bcs.u64(),
      min_output: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof TradeInitiatedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof TradeInitiatedEvent.instantiateBcs> {
    if (!TradeInitiatedEvent.cachedBcs) {
      TradeInitiatedEvent.cachedBcs = TradeInitiatedEvent.instantiateBcs()
    }
    return TradeInitiatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): TradeInitiatedEvent {
    return TradeInitiatedEvent.reified().new({
      dcaId: decodeFromFields(ID.reified(), fields.dca_id),
      executor: decodeFromFields('address', fields.executor),
      inputAmount: decodeFromFields('u64', fields.input_amount),
      feeAmount: decodeFromFields('u64', fields.fee_amount),
      remainingOrders: decodeFromFields('u64', fields.remaining_orders),
      orderNumber: decodeFromFields('u64', fields.order_number),
      minOutput: decodeFromFields('u64', fields.min_output),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TradeInitiatedEvent {
    if (!isTradeInitiatedEvent(item.type)) {
      throw new Error('not a TradeInitiatedEvent type')
    }

    return TradeInitiatedEvent.reified().new({
      dcaId: decodeFromFieldsWithTypes(ID.reified(), item.fields.dca_id),
      executor: decodeFromFieldsWithTypes('address', item.fields.executor),
      inputAmount: decodeFromFieldsWithTypes('u64', item.fields.input_amount),
      feeAmount: decodeFromFieldsWithTypes('u64', item.fields.fee_amount),
      remainingOrders: decodeFromFieldsWithTypes('u64', item.fields.remaining_orders),
      orderNumber: decodeFromFieldsWithTypes('u64', item.fields.order_number),
      minOutput: decodeFromFieldsWithTypes('u64', item.fields.min_output),
    })
  }

  static fromBcs(data: Uint8Array): TradeInitiatedEvent {
    return TradeInitiatedEvent.fromFields(TradeInitiatedEvent.bcs.parse(data))
  }

  toJSONField(): TradeInitiatedEventJSONField {
    return {
      dcaId: this.dcaId,
      executor: this.executor,
      inputAmount: this.inputAmount.toString(),
      feeAmount: this.feeAmount.toString(),
      remainingOrders: this.remainingOrders.toString(),
      orderNumber: this.orderNumber.toString(),
      minOutput: this.minOutput.toString(),
    }
  }

  toJSON(): TradeInitiatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): TradeInitiatedEvent {
    return TradeInitiatedEvent.reified().new({
      dcaId: decodeFromJSONField(ID.reified(), field.dcaId),
      executor: decodeFromJSONField('address', field.executor),
      inputAmount: decodeFromJSONField('u64', field.inputAmount),
      feeAmount: decodeFromJSONField('u64', field.feeAmount),
      remainingOrders: decodeFromJSONField('u64', field.remainingOrders),
      orderNumber: decodeFromJSONField('u64', field.orderNumber),
      minOutput: decodeFromJSONField('u64', field.minOutput),
    })
  }

  static fromJSON(json: Record<string, any>): TradeInitiatedEvent {
    if (json.$typeName !== TradeInitiatedEvent.$typeName) {
      throw new Error(
        `not a TradeInitiatedEvent json object: expected '${TradeInitiatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return TradeInitiatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): TradeInitiatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTradeInitiatedEvent(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a TradeInitiatedEvent object`)
    }
    return TradeInitiatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): TradeInitiatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTradeInitiatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a TradeInitiatedEvent object`)
      }

      return TradeInitiatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TradeInitiatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<TradeInitiatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isTradeInitiatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a TradeInitiatedEvent object`)
    }

    return TradeInitiatedEvent.fromBcs(res.bcsBytes)
  }
}

/* ============================== TradeCompletedEvent =============================== */

export function isTradeCompletedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'dca::TradeCompletedEvent')}::dca::TradeCompletedEvent`
}

export interface TradeCompletedEventFields {
  dcaId: ToField<ID>
  /** Address that executed the trade */
  executor: ToField<'address'>
  /** Output amount received from DEX */
  outputAmount: ToField<'u64'>
  /** Executor reward claimed */
  executorReward: ToField<'u64'>
  /** Whether the DCA account is still active */
  active: ToField<'bool'>
}

export type TradeCompletedEventReified = Reified<TradeCompletedEvent, TradeCompletedEventFields>

export type TradeCompletedEventJSONField = {
  dcaId: string
  executor: string
  outputAmount: string
  executorReward: string
  active: boolean
}

export type TradeCompletedEventJSON = {
  $typeName: typeof TradeCompletedEvent.$typeName
  $typeArgs: []
} & TradeCompletedEventJSONField

/** Emitted when resolve_trade completes (trade finalized) */
export class TradeCompletedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::TradeCompletedEvent` = `${
    getTypeOrigin('dca', 'dca::TradeCompletedEvent')
  }::dca::TradeCompletedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof TradeCompletedEvent.$typeName = TradeCompletedEvent.$typeName
  readonly $fullTypeName: `${string}::dca::TradeCompletedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof TradeCompletedEvent.$isPhantom = TradeCompletedEvent.$isPhantom

  readonly dcaId: ToField<ID>
  /** Address that executed the trade */
  readonly executor: ToField<'address'>
  /** Output amount received from DEX */
  readonly outputAmount: ToField<'u64'>
  /** Executor reward claimed */
  readonly executorReward: ToField<'u64'>
  /** Whether the DCA account is still active */
  readonly active: ToField<'bool'>

  private constructor(typeArgs: [], fields: TradeCompletedEventFields) {
    this.$fullTypeName = composeSuiType(
      TradeCompletedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::dca::TradeCompletedEvent`
    this.$typeArgs = typeArgs

    this.dcaId = fields.dcaId
    this.executor = fields.executor
    this.outputAmount = fields.outputAmount
    this.executorReward = fields.executorReward
    this.active = fields.active
  }

  static reified(): TradeCompletedEventReified {
    const reifiedBcs = TradeCompletedEvent.bcs
    return {
      typeName: TradeCompletedEvent.$typeName,
      fullTypeName: composeSuiType(
        TradeCompletedEvent.$typeName,
        ...[],
      ) as `${string}::dca::TradeCompletedEvent`,
      typeArgs: [] as [],
      isPhantom: TradeCompletedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => TradeCompletedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => TradeCompletedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => TradeCompletedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TradeCompletedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => TradeCompletedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => TradeCompletedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => TradeCompletedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        TradeCompletedEvent.fetch(client, id),
      new: (fields: TradeCompletedEventFields) => {
        return new TradeCompletedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TradeCompletedEventReified {
    return TradeCompletedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<TradeCompletedEvent>> {
    return phantom(TradeCompletedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<TradeCompletedEvent>> {
    return TradeCompletedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('TradeCompletedEvent', {
      dca_id: ID.bcs,
      executor: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      output_amount: bcs.u64(),
      executor_reward: bcs.u64(),
      active: bcs.bool(),
    })
  }

  private static cachedBcs: ReturnType<typeof TradeCompletedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof TradeCompletedEvent.instantiateBcs> {
    if (!TradeCompletedEvent.cachedBcs) {
      TradeCompletedEvent.cachedBcs = TradeCompletedEvent.instantiateBcs()
    }
    return TradeCompletedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): TradeCompletedEvent {
    return TradeCompletedEvent.reified().new({
      dcaId: decodeFromFields(ID.reified(), fields.dca_id),
      executor: decodeFromFields('address', fields.executor),
      outputAmount: decodeFromFields('u64', fields.output_amount),
      executorReward: decodeFromFields('u64', fields.executor_reward),
      active: decodeFromFields('bool', fields.active),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TradeCompletedEvent {
    if (!isTradeCompletedEvent(item.type)) {
      throw new Error('not a TradeCompletedEvent type')
    }

    return TradeCompletedEvent.reified().new({
      dcaId: decodeFromFieldsWithTypes(ID.reified(), item.fields.dca_id),
      executor: decodeFromFieldsWithTypes('address', item.fields.executor),
      outputAmount: decodeFromFieldsWithTypes('u64', item.fields.output_amount),
      executorReward: decodeFromFieldsWithTypes('u64', item.fields.executor_reward),
      active: decodeFromFieldsWithTypes('bool', item.fields.active),
    })
  }

  static fromBcs(data: Uint8Array): TradeCompletedEvent {
    return TradeCompletedEvent.fromFields(TradeCompletedEvent.bcs.parse(data))
  }

  toJSONField(): TradeCompletedEventJSONField {
    return {
      dcaId: this.dcaId,
      executor: this.executor,
      outputAmount: this.outputAmount.toString(),
      executorReward: this.executorReward.toString(),
      active: this.active,
    }
  }

  toJSON(): TradeCompletedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): TradeCompletedEvent {
    return TradeCompletedEvent.reified().new({
      dcaId: decodeFromJSONField(ID.reified(), field.dcaId),
      executor: decodeFromJSONField('address', field.executor),
      outputAmount: decodeFromJSONField('u64', field.outputAmount),
      executorReward: decodeFromJSONField('u64', field.executorReward),
      active: decodeFromJSONField('bool', field.active),
    })
  }

  static fromJSON(json: Record<string, any>): TradeCompletedEvent {
    if (json.$typeName !== TradeCompletedEvent.$typeName) {
      throw new Error(
        `not a TradeCompletedEvent json object: expected '${TradeCompletedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return TradeCompletedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): TradeCompletedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTradeCompletedEvent(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a TradeCompletedEvent object`)
    }
    return TradeCompletedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): TradeCompletedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTradeCompletedEvent(data.bcs.type)) {
        throw new Error(`object at is not a TradeCompletedEvent object`)
      }

      return TradeCompletedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TradeCompletedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<TradeCompletedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isTradeCompletedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a TradeCompletedEvent object`)
    }

    return TradeCompletedEvent.fromBcs(res.bcsBytes)
  }
}

/* ============================== DCADeactivatedEvent =============================== */

export function isDCADeactivatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'dca::DCADeactivatedEvent')}::dca::DCADeactivatedEvent`
}

export interface DCADeactivatedEventFields {
  dcaId: ToField<ID>
  /** 0=completed_all_orders, 1=owner_deactivated, 2=insufficient_funds */
  reason: ToField<'u8'>
  /** Remaining orders at deactivation */
  remainingOrders: ToField<'u64'>
  /** Remaining input balance */
  remainingInput: ToField<'u64'>
  /** Remaining executor reward balance */
  remainingExecutorReward: ToField<'u64'>
}

export type DCADeactivatedEventReified = Reified<DCADeactivatedEvent, DCADeactivatedEventFields>

export type DCADeactivatedEventJSONField = {
  dcaId: string
  reason: number
  remainingOrders: string
  remainingInput: string
  remainingExecutorReward: string
}

export type DCADeactivatedEventJSON = {
  $typeName: typeof DCADeactivatedEvent.$typeName
  $typeArgs: []
} & DCADeactivatedEventJSONField

/** Emitted when a DCA account is deactivated */
export class DCADeactivatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::DCADeactivatedEvent` = `${
    getTypeOrigin('dca', 'dca::DCADeactivatedEvent')
  }::dca::DCADeactivatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof DCADeactivatedEvent.$typeName = DCADeactivatedEvent.$typeName
  readonly $fullTypeName: `${string}::dca::DCADeactivatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof DCADeactivatedEvent.$isPhantom = DCADeactivatedEvent.$isPhantom

  readonly dcaId: ToField<ID>
  /** 0=completed_all_orders, 1=owner_deactivated, 2=insufficient_funds */
  readonly reason: ToField<'u8'>
  /** Remaining orders at deactivation */
  readonly remainingOrders: ToField<'u64'>
  /** Remaining input balance */
  readonly remainingInput: ToField<'u64'>
  /** Remaining executor reward balance */
  readonly remainingExecutorReward: ToField<'u64'>

  private constructor(typeArgs: [], fields: DCADeactivatedEventFields) {
    this.$fullTypeName = composeSuiType(
      DCADeactivatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::dca::DCADeactivatedEvent`
    this.$typeArgs = typeArgs

    this.dcaId = fields.dcaId
    this.reason = fields.reason
    this.remainingOrders = fields.remainingOrders
    this.remainingInput = fields.remainingInput
    this.remainingExecutorReward = fields.remainingExecutorReward
  }

  static reified(): DCADeactivatedEventReified {
    const reifiedBcs = DCADeactivatedEvent.bcs
    return {
      typeName: DCADeactivatedEvent.$typeName,
      fullTypeName: composeSuiType(
        DCADeactivatedEvent.$typeName,
        ...[],
      ) as `${string}::dca::DCADeactivatedEvent`,
      typeArgs: [] as [],
      isPhantom: DCADeactivatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => DCADeactivatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => DCADeactivatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => DCADeactivatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => DCADeactivatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => DCADeactivatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => DCADeactivatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => DCADeactivatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        DCADeactivatedEvent.fetch(client, id),
      new: (fields: DCADeactivatedEventFields) => {
        return new DCADeactivatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): DCADeactivatedEventReified {
    return DCADeactivatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<DCADeactivatedEvent>> {
    return phantom(DCADeactivatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<DCADeactivatedEvent>> {
    return DCADeactivatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('DCADeactivatedEvent', {
      dca_id: ID.bcs,
      reason: bcs.u8(),
      remaining_orders: bcs.u64(),
      remaining_input: bcs.u64(),
      remaining_executor_reward: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof DCADeactivatedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof DCADeactivatedEvent.instantiateBcs> {
    if (!DCADeactivatedEvent.cachedBcs) {
      DCADeactivatedEvent.cachedBcs = DCADeactivatedEvent.instantiateBcs()
    }
    return DCADeactivatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): DCADeactivatedEvent {
    return DCADeactivatedEvent.reified().new({
      dcaId: decodeFromFields(ID.reified(), fields.dca_id),
      reason: decodeFromFields('u8', fields.reason),
      remainingOrders: decodeFromFields('u64', fields.remaining_orders),
      remainingInput: decodeFromFields('u64', fields.remaining_input),
      remainingExecutorReward: decodeFromFields('u64', fields.remaining_executor_reward),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): DCADeactivatedEvent {
    if (!isDCADeactivatedEvent(item.type)) {
      throw new Error('not a DCADeactivatedEvent type')
    }

    return DCADeactivatedEvent.reified().new({
      dcaId: decodeFromFieldsWithTypes(ID.reified(), item.fields.dca_id),
      reason: decodeFromFieldsWithTypes('u8', item.fields.reason),
      remainingOrders: decodeFromFieldsWithTypes('u64', item.fields.remaining_orders),
      remainingInput: decodeFromFieldsWithTypes('u64', item.fields.remaining_input),
      remainingExecutorReward: decodeFromFieldsWithTypes(
        'u64',
        item.fields.remaining_executor_reward,
      ),
    })
  }

  static fromBcs(data: Uint8Array): DCADeactivatedEvent {
    return DCADeactivatedEvent.fromFields(DCADeactivatedEvent.bcs.parse(data))
  }

  toJSONField(): DCADeactivatedEventJSONField {
    return {
      dcaId: this.dcaId,
      reason: this.reason,
      remainingOrders: this.remainingOrders.toString(),
      remainingInput: this.remainingInput.toString(),
      remainingExecutorReward: this.remainingExecutorReward.toString(),
    }
  }

  toJSON(): DCADeactivatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): DCADeactivatedEvent {
    return DCADeactivatedEvent.reified().new({
      dcaId: decodeFromJSONField(ID.reified(), field.dcaId),
      reason: decodeFromJSONField('u8', field.reason),
      remainingOrders: decodeFromJSONField('u64', field.remainingOrders),
      remainingInput: decodeFromJSONField('u64', field.remainingInput),
      remainingExecutorReward: decodeFromJSONField('u64', field.remainingExecutorReward),
    })
  }

  static fromJSON(json: Record<string, any>): DCADeactivatedEvent {
    if (json.$typeName !== DCADeactivatedEvent.$typeName) {
      throw new Error(
        `not a DCADeactivatedEvent json object: expected '${DCADeactivatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return DCADeactivatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): DCADeactivatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isDCADeactivatedEvent(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a DCADeactivatedEvent object`)
    }
    return DCADeactivatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): DCADeactivatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isDCADeactivatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a DCADeactivatedEvent object`)
      }

      return DCADeactivatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return DCADeactivatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<DCADeactivatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isDCADeactivatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a DCADeactivatedEvent object`)
    }

    return DCADeactivatedEvent.fromBcs(res.bcsBytes)
  }
}

/* ============================== DelegateeUpdatedEvent =============================== */

export function isDelegateeUpdatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type
    === `${getTypeOrigin('dca', 'dca::DelegateeUpdatedEvent')}::dca::DelegateeUpdatedEvent`
}

export interface DelegateeUpdatedEventFields {
  dcaId: ToField<ID>
  oldDelegatee: ToField<'address'>
  newDelegatee: ToField<'address'>
}

export type DelegateeUpdatedEventReified = Reified<
  DelegateeUpdatedEvent,
  DelegateeUpdatedEventFields
>

export type DelegateeUpdatedEventJSONField = {
  dcaId: string
  oldDelegatee: string
  newDelegatee: string
}

export type DelegateeUpdatedEventJSON = {
  $typeName: typeof DelegateeUpdatedEvent.$typeName
  $typeArgs: []
} & DelegateeUpdatedEventJSONField

/** Emitted when delegatee is changed */
export class DelegateeUpdatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::DelegateeUpdatedEvent` = `${
    getTypeOrigin('dca', 'dca::DelegateeUpdatedEvent')
  }::dca::DelegateeUpdatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof DelegateeUpdatedEvent.$typeName = DelegateeUpdatedEvent.$typeName
  readonly $fullTypeName: `${string}::dca::DelegateeUpdatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof DelegateeUpdatedEvent.$isPhantom = DelegateeUpdatedEvent.$isPhantom

  readonly dcaId: ToField<ID>
  readonly oldDelegatee: ToField<'address'>
  readonly newDelegatee: ToField<'address'>

  private constructor(typeArgs: [], fields: DelegateeUpdatedEventFields) {
    this.$fullTypeName = composeSuiType(
      DelegateeUpdatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::dca::DelegateeUpdatedEvent`
    this.$typeArgs = typeArgs

    this.dcaId = fields.dcaId
    this.oldDelegatee = fields.oldDelegatee
    this.newDelegatee = fields.newDelegatee
  }

  static reified(): DelegateeUpdatedEventReified {
    const reifiedBcs = DelegateeUpdatedEvent.bcs
    return {
      typeName: DelegateeUpdatedEvent.$typeName,
      fullTypeName: composeSuiType(
        DelegateeUpdatedEvent.$typeName,
        ...[],
      ) as `${string}::dca::DelegateeUpdatedEvent`,
      typeArgs: [] as [],
      isPhantom: DelegateeUpdatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => DelegateeUpdatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        DelegateeUpdatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => DelegateeUpdatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => DelegateeUpdatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => DelegateeUpdatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        DelegateeUpdatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        DelegateeUpdatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        DelegateeUpdatedEvent.fetch(client, id),
      new: (fields: DelegateeUpdatedEventFields) => {
        return new DelegateeUpdatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): DelegateeUpdatedEventReified {
    return DelegateeUpdatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<DelegateeUpdatedEvent>> {
    return phantom(DelegateeUpdatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<DelegateeUpdatedEvent>> {
    return DelegateeUpdatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('DelegateeUpdatedEvent', {
      dca_id: ID.bcs,
      old_delegatee: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      new_delegatee: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    })
  }

  private static cachedBcs: ReturnType<typeof DelegateeUpdatedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof DelegateeUpdatedEvent.instantiateBcs> {
    if (!DelegateeUpdatedEvent.cachedBcs) {
      DelegateeUpdatedEvent.cachedBcs = DelegateeUpdatedEvent.instantiateBcs()
    }
    return DelegateeUpdatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): DelegateeUpdatedEvent {
    return DelegateeUpdatedEvent.reified().new({
      dcaId: decodeFromFields(ID.reified(), fields.dca_id),
      oldDelegatee: decodeFromFields('address', fields.old_delegatee),
      newDelegatee: decodeFromFields('address', fields.new_delegatee),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): DelegateeUpdatedEvent {
    if (!isDelegateeUpdatedEvent(item.type)) {
      throw new Error('not a DelegateeUpdatedEvent type')
    }

    return DelegateeUpdatedEvent.reified().new({
      dcaId: decodeFromFieldsWithTypes(ID.reified(), item.fields.dca_id),
      oldDelegatee: decodeFromFieldsWithTypes('address', item.fields.old_delegatee),
      newDelegatee: decodeFromFieldsWithTypes('address', item.fields.new_delegatee),
    })
  }

  static fromBcs(data: Uint8Array): DelegateeUpdatedEvent {
    return DelegateeUpdatedEvent.fromFields(DelegateeUpdatedEvent.bcs.parse(data))
  }

  toJSONField(): DelegateeUpdatedEventJSONField {
    return {
      dcaId: this.dcaId,
      oldDelegatee: this.oldDelegatee,
      newDelegatee: this.newDelegatee,
    }
  }

  toJSON(): DelegateeUpdatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): DelegateeUpdatedEvent {
    return DelegateeUpdatedEvent.reified().new({
      dcaId: decodeFromJSONField(ID.reified(), field.dcaId),
      oldDelegatee: decodeFromJSONField('address', field.oldDelegatee),
      newDelegatee: decodeFromJSONField('address', field.newDelegatee),
    })
  }

  static fromJSON(json: Record<string, any>): DelegateeUpdatedEvent {
    if (json.$typeName !== DelegateeUpdatedEvent.$typeName) {
      throw new Error(
        `not a DelegateeUpdatedEvent json object: expected '${DelegateeUpdatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return DelegateeUpdatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): DelegateeUpdatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isDelegateeUpdatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a DelegateeUpdatedEvent object`,
      )
    }
    return DelegateeUpdatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): DelegateeUpdatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isDelegateeUpdatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a DelegateeUpdatedEvent object`)
      }

      return DelegateeUpdatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return DelegateeUpdatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<DelegateeUpdatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isDelegateeUpdatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a DelegateeUpdatedEvent object`)
    }

    return DelegateeUpdatedEvent.fromBcs(res.bcsBytes)
  }
}

/* ============================== SlippageUpdatedEvent =============================== */

export function isSlippageUpdatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'dca::SlippageUpdatedEvent')}::dca::SlippageUpdatedEvent`
}

export interface SlippageUpdatedEventFields {
  dcaId: ToField<ID>
  oldSlippageBps: ToField<Option<'u64'>>
  newSlippageBps: ToField<Option<'u64'>>
}

export type SlippageUpdatedEventReified = Reified<SlippageUpdatedEvent, SlippageUpdatedEventFields>

export type SlippageUpdatedEventJSONField = {
  dcaId: string
  oldSlippageBps: string | null
  newSlippageBps: string | null
}

export type SlippageUpdatedEventJSON = {
  $typeName: typeof SlippageUpdatedEvent.$typeName
  $typeArgs: []
} & SlippageUpdatedEventJSONField

/** Emitted when slippage tolerance is updated */
export class SlippageUpdatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::dca::SlippageUpdatedEvent` = `${
    getTypeOrigin('dca', 'dca::SlippageUpdatedEvent')
  }::dca::SlippageUpdatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof SlippageUpdatedEvent.$typeName = SlippageUpdatedEvent.$typeName
  readonly $fullTypeName: `${string}::dca::SlippageUpdatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof SlippageUpdatedEvent.$isPhantom = SlippageUpdatedEvent.$isPhantom

  readonly dcaId: ToField<ID>
  readonly oldSlippageBps: ToField<Option<'u64'>>
  readonly newSlippageBps: ToField<Option<'u64'>>

  private constructor(typeArgs: [], fields: SlippageUpdatedEventFields) {
    this.$fullTypeName = composeSuiType(
      SlippageUpdatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::dca::SlippageUpdatedEvent`
    this.$typeArgs = typeArgs

    this.dcaId = fields.dcaId
    this.oldSlippageBps = fields.oldSlippageBps
    this.newSlippageBps = fields.newSlippageBps
  }

  static reified(): SlippageUpdatedEventReified {
    const reifiedBcs = SlippageUpdatedEvent.bcs
    return {
      typeName: SlippageUpdatedEvent.$typeName,
      fullTypeName: composeSuiType(
        SlippageUpdatedEvent.$typeName,
        ...[],
      ) as `${string}::dca::SlippageUpdatedEvent`,
      typeArgs: [] as [],
      isPhantom: SlippageUpdatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => SlippageUpdatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        SlippageUpdatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => SlippageUpdatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => SlippageUpdatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => SlippageUpdatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        SlippageUpdatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        SlippageUpdatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        SlippageUpdatedEvent.fetch(client, id),
      new: (fields: SlippageUpdatedEventFields) => {
        return new SlippageUpdatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): SlippageUpdatedEventReified {
    return SlippageUpdatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<SlippageUpdatedEvent>> {
    return phantom(SlippageUpdatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<SlippageUpdatedEvent>> {
    return SlippageUpdatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('SlippageUpdatedEvent', {
      dca_id: ID.bcs,
      old_slippage_bps: Option.bcs(bcs.u64()),
      new_slippage_bps: Option.bcs(bcs.u64()),
    })
  }

  private static cachedBcs: ReturnType<typeof SlippageUpdatedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof SlippageUpdatedEvent.instantiateBcs> {
    if (!SlippageUpdatedEvent.cachedBcs) {
      SlippageUpdatedEvent.cachedBcs = SlippageUpdatedEvent.instantiateBcs()
    }
    return SlippageUpdatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): SlippageUpdatedEvent {
    return SlippageUpdatedEvent.reified().new({
      dcaId: decodeFromFields(ID.reified(), fields.dca_id),
      oldSlippageBps: decodeFromFields(Option.reified('u64'), fields.old_slippage_bps),
      newSlippageBps: decodeFromFields(Option.reified('u64'), fields.new_slippage_bps),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): SlippageUpdatedEvent {
    if (!isSlippageUpdatedEvent(item.type)) {
      throw new Error('not a SlippageUpdatedEvent type')
    }

    return SlippageUpdatedEvent.reified().new({
      dcaId: decodeFromFieldsWithTypes(ID.reified(), item.fields.dca_id),
      oldSlippageBps: decodeFromFieldsWithTypes(
        Option.reified('u64'),
        item.fields.old_slippage_bps,
      ),
      newSlippageBps: decodeFromFieldsWithTypes(
        Option.reified('u64'),
        item.fields.new_slippage_bps,
      ),
    })
  }

  static fromBcs(data: Uint8Array): SlippageUpdatedEvent {
    return SlippageUpdatedEvent.fromFields(SlippageUpdatedEvent.bcs.parse(data))
  }

  toJSONField(): SlippageUpdatedEventJSONField {
    return {
      dcaId: this.dcaId,
      oldSlippageBps: fieldToJSON<Option<'u64'>>(`${Option.$typeName}<u64>`, this.oldSlippageBps),
      newSlippageBps: fieldToJSON<Option<'u64'>>(`${Option.$typeName}<u64>`, this.newSlippageBps),
    }
  }

  toJSON(): SlippageUpdatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): SlippageUpdatedEvent {
    return SlippageUpdatedEvent.reified().new({
      dcaId: decodeFromJSONField(ID.reified(), field.dcaId),
      oldSlippageBps: decodeFromJSONField(Option.reified('u64'), field.oldSlippageBps),
      newSlippageBps: decodeFromJSONField(Option.reified('u64'), field.newSlippageBps),
    })
  }

  static fromJSON(json: Record<string, any>): SlippageUpdatedEvent {
    if (json.$typeName !== SlippageUpdatedEvent.$typeName) {
      throw new Error(
        `not a SlippageUpdatedEvent json object: expected '${SlippageUpdatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return SlippageUpdatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): SlippageUpdatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isSlippageUpdatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a SlippageUpdatedEvent object`,
      )
    }
    return SlippageUpdatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): SlippageUpdatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isSlippageUpdatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a SlippageUpdatedEvent object`)
      }

      return SlippageUpdatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return SlippageUpdatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<SlippageUpdatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isSlippageUpdatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a SlippageUpdatedEvent object`)
    }

    return SlippageUpdatedEvent.fromBcs(res.bcsBytes)
  }
}
