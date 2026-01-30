import { bcs } from '@mysten/sui/bcs'
import { SuiObjectData, SuiParsedData } from '@mysten/sui/client'
import { fromBase64, fromHex, toHex } from '@mysten/sui/utils'
import { getTypeOrigin } from '../../../_envs'
import {
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  phantom,
  PhantomReified,
  Reified,
  StructClass,
  ToField,
  ToJSON,
  ToTypeStr,
} from '../../../_framework/reified'
import {
  composeSuiType,
  compressSuiType,
  fetchObjectBcs,
  FieldsWithTypes,
  SupportedSuiClient,
} from '../../../_framework/util'
import { String } from '../../std/string/structs'
import { Bag } from '../../sui/bag/structs'
import { UID } from '../../sui/object/structs'
import { Treasury } from '../treasury/structs'

/* ============================== Container =============================== */

export function isContainer(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('flowx-amm', 'factory::Container')}::factory::Container`
}

export interface ContainerFields {
  id: ToField<UID>
  pairs: ToField<Bag>
  treasury: ToField<Treasury>
}

export type ContainerReified = Reified<Container, ContainerFields>

export type ContainerJSONField = {
  id: string
  pairs: ToJSON<Bag>
  treasury: ToJSON<Treasury>
}

export type ContainerJSON = {
  $typeName: typeof Container.$typeName
  $typeArgs: []
} & ContainerJSONField

export class Container implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::factory::Container` = `${
    getTypeOrigin('flowx-amm', 'factory::Container')
  }::factory::Container` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof Container.$typeName = Container.$typeName
  readonly $fullTypeName: `${string}::factory::Container`
  readonly $typeArgs: []
  readonly $isPhantom: typeof Container.$isPhantom = Container.$isPhantom

  readonly id: ToField<UID>
  readonly pairs: ToField<Bag>
  readonly treasury: ToField<Treasury>

  private constructor(typeArgs: [], fields: ContainerFields) {
    this.$fullTypeName = composeSuiType(
      Container.$typeName,
      ...typeArgs,
    ) as `${string}::factory::Container`
    this.$typeArgs = typeArgs

    this.id = fields.id
    this.pairs = fields.pairs
    this.treasury = fields.treasury
  }

  static reified(): ContainerReified {
    const reifiedBcs = Container.bcs
    return {
      typeName: Container.$typeName,
      fullTypeName: composeSuiType(
        Container.$typeName,
        ...[],
      ) as `${string}::factory::Container`,
      typeArgs: [] as [],
      isPhantom: Container.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => Container.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => Container.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => Container.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => Container.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => Container.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => Container.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => Container.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => Container.fetch(client, id),
      new: (fields: ContainerFields) => {
        return new Container([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): ContainerReified {
    return Container.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<Container>> {
    return phantom(Container.reified())
  }

  static get p(): PhantomReified<ToTypeStr<Container>> {
    return Container.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('Container', {
      id: UID.bcs,
      pairs: Bag.bcs,
      treasury: Treasury.bcs,
    })
  }

  private static cachedBcs: ReturnType<typeof Container.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof Container.instantiateBcs> {
    if (!Container.cachedBcs) {
      Container.cachedBcs = Container.instantiateBcs()
    }
    return Container.cachedBcs
  }

  static fromFields(fields: Record<string, any>): Container {
    return Container.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      pairs: decodeFromFields(Bag.reified(), fields.pairs),
      treasury: decodeFromFields(Treasury.reified(), fields.treasury),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): Container {
    if (!isContainer(item.type)) {
      throw new Error('not a Container type')
    }

    return Container.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      pairs: decodeFromFieldsWithTypes(Bag.reified(), item.fields.pairs),
      treasury: decodeFromFieldsWithTypes(Treasury.reified(), item.fields.treasury),
    })
  }

  static fromBcs(data: Uint8Array): Container {
    return Container.fromFields(Container.bcs.parse(data))
  }

  toJSONField(): ContainerJSONField {
    return {
      id: this.id,
      pairs: this.pairs.toJSONField(),
      treasury: this.treasury.toJSONField(),
    }
  }

  toJSON(): ContainerJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): Container {
    return Container.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      pairs: decodeFromJSONField(Bag.reified(), field.pairs),
      treasury: decodeFromJSONField(Treasury.reified(), field.treasury),
    })
  }

  static fromJSON(json: Record<string, any>): Container {
    if (json.$typeName !== Container.$typeName) {
      throw new Error(
        `not a Container json object: expected '${Container.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return Container.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): Container {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isContainer(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a Container object`)
    }
    return Container.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): Container {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isContainer(data.bcs.type)) {
        throw new Error(`object at is not a Container object`)
      }

      return Container.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return Container.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<Container> {
    const res = await fetchObjectBcs(client, id)
    if (!isContainer(res.type)) {
      throw new Error(`object at id ${id} is not a Container object`)
    }

    return Container.fromBcs(res.bcsBytes)
  }
}

/* ============================== AdminCap =============================== */

export function isAdminCap(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('flowx-amm', 'factory::AdminCap')}::factory::AdminCap`
}

export interface AdminCapFields {
  id: ToField<UID>
}

export type AdminCapReified = Reified<AdminCap, AdminCapFields>

export type AdminCapJSONField = {
  id: string
}

export type AdminCapJSON = {
  $typeName: typeof AdminCap.$typeName
  $typeArgs: []
} & AdminCapJSONField

export class AdminCap implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::factory::AdminCap` = `${
    getTypeOrigin('flowx-amm', 'factory::AdminCap')
  }::factory::AdminCap` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof AdminCap.$typeName = AdminCap.$typeName
  readonly $fullTypeName: `${string}::factory::AdminCap`
  readonly $typeArgs: []
  readonly $isPhantom: typeof AdminCap.$isPhantom = AdminCap.$isPhantom

  readonly id: ToField<UID>

  private constructor(typeArgs: [], fields: AdminCapFields) {
    this.$fullTypeName = composeSuiType(
      AdminCap.$typeName,
      ...typeArgs,
    ) as `${string}::factory::AdminCap`
    this.$typeArgs = typeArgs

    this.id = fields.id
  }

  static reified(): AdminCapReified {
    const reifiedBcs = AdminCap.bcs
    return {
      typeName: AdminCap.$typeName,
      fullTypeName: composeSuiType(
        AdminCap.$typeName,
        ...[],
      ) as `${string}::factory::AdminCap`,
      typeArgs: [] as [],
      isPhantom: AdminCap.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => AdminCap.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => AdminCap.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => AdminCap.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => AdminCap.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => AdminCap.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => AdminCap.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => AdminCap.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => AdminCap.fetch(client, id),
      new: (fields: AdminCapFields) => {
        return new AdminCap([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): AdminCapReified {
    return AdminCap.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<AdminCap>> {
    return phantom(AdminCap.reified())
  }

  static get p(): PhantomReified<ToTypeStr<AdminCap>> {
    return AdminCap.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('AdminCap', {
      id: UID.bcs,
    })
  }

  private static cachedBcs: ReturnType<typeof AdminCap.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof AdminCap.instantiateBcs> {
    if (!AdminCap.cachedBcs) {
      AdminCap.cachedBcs = AdminCap.instantiateBcs()
    }
    return AdminCap.cachedBcs
  }

  static fromFields(fields: Record<string, any>): AdminCap {
    return AdminCap.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): AdminCap {
    if (!isAdminCap(item.type)) {
      throw new Error('not a AdminCap type')
    }

    return AdminCap.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
    })
  }

  static fromBcs(data: Uint8Array): AdminCap {
    return AdminCap.fromFields(AdminCap.bcs.parse(data))
  }

  toJSONField(): AdminCapJSONField {
    return {
      id: this.id,
    }
  }

  toJSON(): AdminCapJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): AdminCap {
    return AdminCap.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
    })
  }

  static fromJSON(json: Record<string, any>): AdminCap {
    if (json.$typeName !== AdminCap.$typeName) {
      throw new Error(
        `not a AdminCap json object: expected '${AdminCap.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return AdminCap.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): AdminCap {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isAdminCap(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a AdminCap object`)
    }
    return AdminCap.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): AdminCap {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isAdminCap(data.bcs.type)) {
        throw new Error(`object at is not a AdminCap object`)
      }

      return AdminCap.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return AdminCap.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<AdminCap> {
    const res = await fetchObjectBcs(client, id)
    if (!isAdminCap(res.type)) {
      throw new Error(`object at id ${id} is not a AdminCap object`)
    }

    return AdminCap.fromBcs(res.bcsBytes)
  }
}

/* ============================== PairCreated =============================== */

export function isPairCreated(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('flowx-amm', 'factory::PairCreated')}::factory::PairCreated`
}

export interface PairCreatedFields {
  user: ToField<'address'>
  pair: ToField<String>
  coinX: ToField<String>
  coinY: ToField<String>
}

export type PairCreatedReified = Reified<PairCreated, PairCreatedFields>

export type PairCreatedJSONField = {
  user: string
  pair: string
  coinX: string
  coinY: string
}

export type PairCreatedJSON = {
  $typeName: typeof PairCreated.$typeName
  $typeArgs: []
} & PairCreatedJSONField

export class PairCreated implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::factory::PairCreated` = `${
    getTypeOrigin('flowx-amm', 'factory::PairCreated')
  }::factory::PairCreated` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof PairCreated.$typeName = PairCreated.$typeName
  readonly $fullTypeName: `${string}::factory::PairCreated`
  readonly $typeArgs: []
  readonly $isPhantom: typeof PairCreated.$isPhantom = PairCreated.$isPhantom

  readonly user: ToField<'address'>
  readonly pair: ToField<String>
  readonly coinX: ToField<String>
  readonly coinY: ToField<String>

  private constructor(typeArgs: [], fields: PairCreatedFields) {
    this.$fullTypeName = composeSuiType(
      PairCreated.$typeName,
      ...typeArgs,
    ) as `${string}::factory::PairCreated`
    this.$typeArgs = typeArgs

    this.user = fields.user
    this.pair = fields.pair
    this.coinX = fields.coinX
    this.coinY = fields.coinY
  }

  static reified(): PairCreatedReified {
    const reifiedBcs = PairCreated.bcs
    return {
      typeName: PairCreated.$typeName,
      fullTypeName: composeSuiType(
        PairCreated.$typeName,
        ...[],
      ) as `${string}::factory::PairCreated`,
      typeArgs: [] as [],
      isPhantom: PairCreated.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => PairCreated.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => PairCreated.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => PairCreated.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => PairCreated.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => PairCreated.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => PairCreated.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => PairCreated.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => PairCreated.fetch(client, id),
      new: (fields: PairCreatedFields) => {
        return new PairCreated([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): PairCreatedReified {
    return PairCreated.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<PairCreated>> {
    return phantom(PairCreated.reified())
  }

  static get p(): PhantomReified<ToTypeStr<PairCreated>> {
    return PairCreated.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('PairCreated', {
      user: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      pair: String.bcs,
      coin_x: String.bcs,
      coin_y: String.bcs,
    })
  }

  private static cachedBcs: ReturnType<typeof PairCreated.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof PairCreated.instantiateBcs> {
    if (!PairCreated.cachedBcs) {
      PairCreated.cachedBcs = PairCreated.instantiateBcs()
    }
    return PairCreated.cachedBcs
  }

  static fromFields(fields: Record<string, any>): PairCreated {
    return PairCreated.reified().new({
      user: decodeFromFields('address', fields.user),
      pair: decodeFromFields(String.reified(), fields.pair),
      coinX: decodeFromFields(String.reified(), fields.coin_x),
      coinY: decodeFromFields(String.reified(), fields.coin_y),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): PairCreated {
    if (!isPairCreated(item.type)) {
      throw new Error('not a PairCreated type')
    }

    return PairCreated.reified().new({
      user: decodeFromFieldsWithTypes('address', item.fields.user),
      pair: decodeFromFieldsWithTypes(String.reified(), item.fields.pair),
      coinX: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_x),
      coinY: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_y),
    })
  }

  static fromBcs(data: Uint8Array): PairCreated {
    return PairCreated.fromFields(PairCreated.bcs.parse(data))
  }

  toJSONField(): PairCreatedJSONField {
    return {
      user: this.user,
      pair: this.pair,
      coinX: this.coinX,
      coinY: this.coinY,
    }
  }

  toJSON(): PairCreatedJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): PairCreated {
    return PairCreated.reified().new({
      user: decodeFromJSONField('address', field.user),
      pair: decodeFromJSONField(String.reified(), field.pair),
      coinX: decodeFromJSONField(String.reified(), field.coinX),
      coinY: decodeFromJSONField(String.reified(), field.coinY),
    })
  }

  static fromJSON(json: Record<string, any>): PairCreated {
    if (json.$typeName !== PairCreated.$typeName) {
      throw new Error(
        `not a PairCreated json object: expected '${PairCreated.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return PairCreated.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): PairCreated {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isPairCreated(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a PairCreated object`)
    }
    return PairCreated.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): PairCreated {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isPairCreated(data.bcs.type)) {
        throw new Error(`object at is not a PairCreated object`)
      }

      return PairCreated.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return PairCreated.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<PairCreated> {
    const res = await fetchObjectBcs(client, id)
    if (!isPairCreated(res.type)) {
      throw new Error(`object at id ${id} is not a PairCreated object`)
    }

    return PairCreated.fromBcs(res.bcsBytes)
  }
}

/* ============================== FeeChanged =============================== */

export function isFeeChanged(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('flowx-amm', 'factory::FeeChanged')}::factory::FeeChanged`
}

export interface FeeChangedFields {
  user: ToField<'address'>
  coinX: ToField<String>
  coinY: ToField<String>
  feeRate: ToField<'u64'>
}

export type FeeChangedReified = Reified<FeeChanged, FeeChangedFields>

export type FeeChangedJSONField = {
  user: string
  coinX: string
  coinY: string
  feeRate: string
}

export type FeeChangedJSON = {
  $typeName: typeof FeeChanged.$typeName
  $typeArgs: []
} & FeeChangedJSONField

export class FeeChanged implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::factory::FeeChanged` = `${
    getTypeOrigin('flowx-amm', 'factory::FeeChanged')
  }::factory::FeeChanged` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof FeeChanged.$typeName = FeeChanged.$typeName
  readonly $fullTypeName: `${string}::factory::FeeChanged`
  readonly $typeArgs: []
  readonly $isPhantom: typeof FeeChanged.$isPhantom = FeeChanged.$isPhantom

  readonly user: ToField<'address'>
  readonly coinX: ToField<String>
  readonly coinY: ToField<String>
  readonly feeRate: ToField<'u64'>

  private constructor(typeArgs: [], fields: FeeChangedFields) {
    this.$fullTypeName = composeSuiType(
      FeeChanged.$typeName,
      ...typeArgs,
    ) as `${string}::factory::FeeChanged`
    this.$typeArgs = typeArgs

    this.user = fields.user
    this.coinX = fields.coinX
    this.coinY = fields.coinY
    this.feeRate = fields.feeRate
  }

  static reified(): FeeChangedReified {
    const reifiedBcs = FeeChanged.bcs
    return {
      typeName: FeeChanged.$typeName,
      fullTypeName: composeSuiType(
        FeeChanged.$typeName,
        ...[],
      ) as `${string}::factory::FeeChanged`,
      typeArgs: [] as [],
      isPhantom: FeeChanged.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => FeeChanged.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => FeeChanged.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => FeeChanged.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => FeeChanged.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => FeeChanged.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => FeeChanged.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => FeeChanged.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => FeeChanged.fetch(client, id),
      new: (fields: FeeChangedFields) => {
        return new FeeChanged([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): FeeChangedReified {
    return FeeChanged.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<FeeChanged>> {
    return phantom(FeeChanged.reified())
  }

  static get p(): PhantomReified<ToTypeStr<FeeChanged>> {
    return FeeChanged.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('FeeChanged', {
      user: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      coin_x: String.bcs,
      coin_y: String.bcs,
      fee_rate: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof FeeChanged.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof FeeChanged.instantiateBcs> {
    if (!FeeChanged.cachedBcs) {
      FeeChanged.cachedBcs = FeeChanged.instantiateBcs()
    }
    return FeeChanged.cachedBcs
  }

  static fromFields(fields: Record<string, any>): FeeChanged {
    return FeeChanged.reified().new({
      user: decodeFromFields('address', fields.user),
      coinX: decodeFromFields(String.reified(), fields.coin_x),
      coinY: decodeFromFields(String.reified(), fields.coin_y),
      feeRate: decodeFromFields('u64', fields.fee_rate),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): FeeChanged {
    if (!isFeeChanged(item.type)) {
      throw new Error('not a FeeChanged type')
    }

    return FeeChanged.reified().new({
      user: decodeFromFieldsWithTypes('address', item.fields.user),
      coinX: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_x),
      coinY: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_y),
      feeRate: decodeFromFieldsWithTypes('u64', item.fields.fee_rate),
    })
  }

  static fromBcs(data: Uint8Array): FeeChanged {
    return FeeChanged.fromFields(FeeChanged.bcs.parse(data))
  }

  toJSONField(): FeeChangedJSONField {
    return {
      user: this.user,
      coinX: this.coinX,
      coinY: this.coinY,
      feeRate: this.feeRate.toString(),
    }
  }

  toJSON(): FeeChangedJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): FeeChanged {
    return FeeChanged.reified().new({
      user: decodeFromJSONField('address', field.user),
      coinX: decodeFromJSONField(String.reified(), field.coinX),
      coinY: decodeFromJSONField(String.reified(), field.coinY),
      feeRate: decodeFromJSONField('u64', field.feeRate),
    })
  }

  static fromJSON(json: Record<string, any>): FeeChanged {
    if (json.$typeName !== FeeChanged.$typeName) {
      throw new Error(
        `not a FeeChanged json object: expected '${FeeChanged.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return FeeChanged.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): FeeChanged {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isFeeChanged(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a FeeChanged object`)
    }
    return FeeChanged.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): FeeChanged {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isFeeChanged(data.bcs.type)) {
        throw new Error(`object at is not a FeeChanged object`)
      }

      return FeeChanged.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return FeeChanged.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<FeeChanged> {
    const res = await fetchObjectBcs(client, id)
    if (!isFeeChanged(res.type)) {
      throw new Error(`object at id ${id} is not a FeeChanged object`)
    }

    return FeeChanged.fromBcs(res.bcsBytes)
  }
}
