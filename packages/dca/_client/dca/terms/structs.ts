/**
 * @title Terms Registry Module
 * @notice Registry for tracking protocol terms stored on Walrus
 * @dev Users must accept current terms when creating DCA accounts
 */

import { bcs } from '@mysten/sui/bcs'
import { SuiObjectData, SuiParsedData } from '@mysten/sui/client'
import { fromBase64 } from '@mysten/sui/utils'
import { ID, UID } from '../../_dependencies/sui/object/structs'
import { getTypeOrigin } from '../../_envs'
import {
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  fieldToJSON,
  phantom,
  PhantomReified,
  Reified,
  StructClass,
  ToField,
  ToJSON,
  ToTypeStr,
  vector,
} from '../../_framework/reified'
import {
  composeSuiType,
  compressSuiType,
  fetchObjectBcs,
  FieldsWithTypes,
  SupportedSuiClient,
} from '../../_framework/util'
import { Vector } from '../../_framework/vector'

/* ============================== TermsVersion =============================== */

export function isTermsVersion(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'terms::TermsVersion')}::terms::TermsVersion`
}

export interface TermsVersionFields {
  /** Walrus blob ID containing the terms document */
  blobId: ToField<Vector<'u8'>>
  /** Version number */
  version: ToField<'u64'>
  /** Timestamp when this version was published */
  timestamp: ToField<'u64'>
}

export type TermsVersionReified = Reified<TermsVersion, TermsVersionFields>

export type TermsVersionJSONField = {
  blobId: number[]
  version: string
  timestamp: string
}

export type TermsVersionJSON = {
  $typeName: typeof TermsVersion.$typeName
  $typeArgs: []
} & TermsVersionJSONField

/** Historical record of a terms version */
export class TermsVersion implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::terms::TermsVersion` = `${
    getTypeOrigin('dca', 'terms::TermsVersion')
  }::terms::TermsVersion` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof TermsVersion.$typeName = TermsVersion.$typeName
  readonly $fullTypeName: `${string}::terms::TermsVersion`
  readonly $typeArgs: []
  readonly $isPhantom: typeof TermsVersion.$isPhantom = TermsVersion.$isPhantom

  /** Walrus blob ID containing the terms document */
  readonly blobId: ToField<Vector<'u8'>>
  /** Version number */
  readonly version: ToField<'u64'>
  /** Timestamp when this version was published */
  readonly timestamp: ToField<'u64'>

  private constructor(typeArgs: [], fields: TermsVersionFields) {
    this.$fullTypeName = composeSuiType(
      TermsVersion.$typeName,
      ...typeArgs,
    ) as `${string}::terms::TermsVersion`
    this.$typeArgs = typeArgs

    this.blobId = fields.blobId
    this.version = fields.version
    this.timestamp = fields.timestamp
  }

  static reified(): TermsVersionReified {
    const reifiedBcs = TermsVersion.bcs
    return {
      typeName: TermsVersion.$typeName,
      fullTypeName: composeSuiType(
        TermsVersion.$typeName,
        ...[],
      ) as `${string}::terms::TermsVersion`,
      typeArgs: [] as [],
      isPhantom: TermsVersion.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => TermsVersion.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => TermsVersion.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => TermsVersion.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TermsVersion.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => TermsVersion.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => TermsVersion.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => TermsVersion.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => TermsVersion.fetch(client, id),
      new: (fields: TermsVersionFields) => {
        return new TermsVersion([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TermsVersionReified {
    return TermsVersion.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<TermsVersion>> {
    return phantom(TermsVersion.reified())
  }

  static get p(): PhantomReified<ToTypeStr<TermsVersion>> {
    return TermsVersion.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('TermsVersion', {
      blob_id: bcs.vector(bcs.u8()),
      version: bcs.u64(),
      timestamp: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof TermsVersion.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof TermsVersion.instantiateBcs> {
    if (!TermsVersion.cachedBcs) {
      TermsVersion.cachedBcs = TermsVersion.instantiateBcs()
    }
    return TermsVersion.cachedBcs
  }

  static fromFields(fields: Record<string, any>): TermsVersion {
    return TermsVersion.reified().new({
      blobId: decodeFromFields(vector('u8'), fields.blob_id),
      version: decodeFromFields('u64', fields.version),
      timestamp: decodeFromFields('u64', fields.timestamp),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TermsVersion {
    if (!isTermsVersion(item.type)) {
      throw new Error('not a TermsVersion type')
    }

    return TermsVersion.reified().new({
      blobId: decodeFromFieldsWithTypes(vector('u8'), item.fields.blob_id),
      version: decodeFromFieldsWithTypes('u64', item.fields.version),
      timestamp: decodeFromFieldsWithTypes('u64', item.fields.timestamp),
    })
  }

  static fromBcs(data: Uint8Array): TermsVersion {
    return TermsVersion.fromFields(TermsVersion.bcs.parse(data))
  }

  toJSONField(): TermsVersionJSONField {
    return {
      blobId: fieldToJSON<Vector<'u8'>>(`vector<u8>`, this.blobId),
      version: this.version.toString(),
      timestamp: this.timestamp.toString(),
    }
  }

  toJSON(): TermsVersionJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): TermsVersion {
    return TermsVersion.reified().new({
      blobId: decodeFromJSONField(vector('u8'), field.blobId),
      version: decodeFromJSONField('u64', field.version),
      timestamp: decodeFromJSONField('u64', field.timestamp),
    })
  }

  static fromJSON(json: Record<string, any>): TermsVersion {
    if (json.$typeName !== TermsVersion.$typeName) {
      throw new Error(
        `not a TermsVersion json object: expected '${TermsVersion.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return TermsVersion.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): TermsVersion {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTermsVersion(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a TermsVersion object`)
    }
    return TermsVersion.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): TermsVersion {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTermsVersion(data.bcs.type)) {
        throw new Error(`object at is not a TermsVersion object`)
      }

      return TermsVersion.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TermsVersion.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<TermsVersion> {
    const res = await fetchObjectBcs(client, id)
    if (!isTermsVersion(res.type)) {
      throw new Error(`object at id ${id} is not a TermsVersion object`)
    }

    return TermsVersion.fromBcs(res.bcsBytes)
  }
}

/* ============================== TermsRegistry =============================== */

export function isTermsRegistry(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'terms::TermsRegistry')}::terms::TermsRegistry`
}

export interface TermsRegistryFields {
  id: ToField<UID>
  /** AdminCap ID for authorization */
  admin: ToField<ID>
  /** Current Walrus blob ID for the terms document */
  currentBlobId: ToField<Vector<'u8'>>
  /** Current version number */
  version: ToField<'u64'>
  /** Minimum version users must accept (can be lower than current) */
  minAcceptedVersion: ToField<'u64'>
  /** History of all terms versions */
  history: ToField<Vector<TermsVersion>>
}

export type TermsRegistryReified = Reified<TermsRegistry, TermsRegistryFields>

export type TermsRegistryJSONField = {
  id: string
  admin: string
  currentBlobId: number[]
  version: string
  minAcceptedVersion: string
  history: ToJSON<TermsVersion>[]
}

export type TermsRegistryJSON = {
  $typeName: typeof TermsRegistry.$typeName
  $typeArgs: []
} & TermsRegistryJSONField

/** Registry tracking protocol terms and versions */
export class TermsRegistry implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::terms::TermsRegistry` = `${
    getTypeOrigin('dca', 'terms::TermsRegistry')
  }::terms::TermsRegistry` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof TermsRegistry.$typeName = TermsRegistry.$typeName
  readonly $fullTypeName: `${string}::terms::TermsRegistry`
  readonly $typeArgs: []
  readonly $isPhantom: typeof TermsRegistry.$isPhantom = TermsRegistry.$isPhantom

  readonly id: ToField<UID>
  /** AdminCap ID for authorization */
  readonly admin: ToField<ID>
  /** Current Walrus blob ID for the terms document */
  readonly currentBlobId: ToField<Vector<'u8'>>
  /** Current version number */
  readonly version: ToField<'u64'>
  /** Minimum version users must accept (can be lower than current) */
  readonly minAcceptedVersion: ToField<'u64'>
  /** History of all terms versions */
  readonly history: ToField<Vector<TermsVersion>>

  private constructor(typeArgs: [], fields: TermsRegistryFields) {
    this.$fullTypeName = composeSuiType(
      TermsRegistry.$typeName,
      ...typeArgs,
    ) as `${string}::terms::TermsRegistry`
    this.$typeArgs = typeArgs

    this.id = fields.id
    this.admin = fields.admin
    this.currentBlobId = fields.currentBlobId
    this.version = fields.version
    this.minAcceptedVersion = fields.minAcceptedVersion
    this.history = fields.history
  }

  static reified(): TermsRegistryReified {
    const reifiedBcs = TermsRegistry.bcs
    return {
      typeName: TermsRegistry.$typeName,
      fullTypeName: composeSuiType(
        TermsRegistry.$typeName,
        ...[],
      ) as `${string}::terms::TermsRegistry`,
      typeArgs: [] as [],
      isPhantom: TermsRegistry.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => TermsRegistry.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => TermsRegistry.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => TermsRegistry.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TermsRegistry.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => TermsRegistry.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => TermsRegistry.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => TermsRegistry.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => TermsRegistry.fetch(client, id),
      new: (fields: TermsRegistryFields) => {
        return new TermsRegistry([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TermsRegistryReified {
    return TermsRegistry.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<TermsRegistry>> {
    return phantom(TermsRegistry.reified())
  }

  static get p(): PhantomReified<ToTypeStr<TermsRegistry>> {
    return TermsRegistry.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('TermsRegistry', {
      id: UID.bcs,
      admin: ID.bcs,
      current_blob_id: bcs.vector(bcs.u8()),
      version: bcs.u64(),
      min_accepted_version: bcs.u64(),
      history: bcs.vector(TermsVersion.bcs),
    })
  }

  private static cachedBcs: ReturnType<typeof TermsRegistry.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof TermsRegistry.instantiateBcs> {
    if (!TermsRegistry.cachedBcs) {
      TermsRegistry.cachedBcs = TermsRegistry.instantiateBcs()
    }
    return TermsRegistry.cachedBcs
  }

  static fromFields(fields: Record<string, any>): TermsRegistry {
    return TermsRegistry.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      admin: decodeFromFields(ID.reified(), fields.admin),
      currentBlobId: decodeFromFields(vector('u8'), fields.current_blob_id),
      version: decodeFromFields('u64', fields.version),
      minAcceptedVersion: decodeFromFields('u64', fields.min_accepted_version),
      history: decodeFromFields(vector(TermsVersion.reified()), fields.history),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TermsRegistry {
    if (!isTermsRegistry(item.type)) {
      throw new Error('not a TermsRegistry type')
    }

    return TermsRegistry.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      admin: decodeFromFieldsWithTypes(ID.reified(), item.fields.admin),
      currentBlobId: decodeFromFieldsWithTypes(vector('u8'), item.fields.current_blob_id),
      version: decodeFromFieldsWithTypes('u64', item.fields.version),
      minAcceptedVersion: decodeFromFieldsWithTypes('u64', item.fields.min_accepted_version),
      history: decodeFromFieldsWithTypes(vector(TermsVersion.reified()), item.fields.history),
    })
  }

  static fromBcs(data: Uint8Array): TermsRegistry {
    return TermsRegistry.fromFields(TermsRegistry.bcs.parse(data))
  }

  toJSONField(): TermsRegistryJSONField {
    return {
      id: this.id,
      admin: this.admin,
      currentBlobId: fieldToJSON<Vector<'u8'>>(`vector<u8>`, this.currentBlobId),
      version: this.version.toString(),
      minAcceptedVersion: this.minAcceptedVersion.toString(),
      history: fieldToJSON<Vector<TermsVersion>>(`vector<${TermsVersion.$typeName}>`, this.history),
    }
  }

  toJSON(): TermsRegistryJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): TermsRegistry {
    return TermsRegistry.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      admin: decodeFromJSONField(ID.reified(), field.admin),
      currentBlobId: decodeFromJSONField(vector('u8'), field.currentBlobId),
      version: decodeFromJSONField('u64', field.version),
      minAcceptedVersion: decodeFromJSONField('u64', field.minAcceptedVersion),
      history: decodeFromJSONField(vector(TermsVersion.reified()), field.history),
    })
  }

  static fromJSON(json: Record<string, any>): TermsRegistry {
    if (json.$typeName !== TermsRegistry.$typeName) {
      throw new Error(
        `not a TermsRegistry json object: expected '${TermsRegistry.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return TermsRegistry.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): TermsRegistry {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTermsRegistry(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a TermsRegistry object`)
    }
    return TermsRegistry.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): TermsRegistry {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTermsRegistry(data.bcs.type)) {
        throw new Error(`object at is not a TermsRegistry object`)
      }

      return TermsRegistry.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TermsRegistry.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<TermsRegistry> {
    const res = await fetchObjectBcs(client, id)
    if (!isTermsRegistry(res.type)) {
      throw new Error(`object at id ${id} is not a TermsRegistry object`)
    }

    return TermsRegistry.fromBcs(res.bcsBytes)
  }
}

/* ============================== TermsRegistryCreatedEvent =============================== */

export function isTermsRegistryCreatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type
    === `${
      getTypeOrigin('dca', 'terms::TermsRegistryCreatedEvent')
    }::terms::TermsRegistryCreatedEvent`
}

export interface TermsRegistryCreatedEventFields {
  registryId: ToField<ID>
  adminCapId: ToField<ID>
  initialBlobId: ToField<Vector<'u8'>>
}

export type TermsRegistryCreatedEventReified = Reified<
  TermsRegistryCreatedEvent,
  TermsRegistryCreatedEventFields
>

export type TermsRegistryCreatedEventJSONField = {
  registryId: string
  adminCapId: string
  initialBlobId: number[]
}

export type TermsRegistryCreatedEventJSON = {
  $typeName: typeof TermsRegistryCreatedEvent.$typeName
  $typeArgs: []
} & TermsRegistryCreatedEventJSONField

export class TermsRegistryCreatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::terms::TermsRegistryCreatedEvent` = `${
    getTypeOrigin('dca', 'terms::TermsRegistryCreatedEvent')
  }::terms::TermsRegistryCreatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof TermsRegistryCreatedEvent.$typeName =
    TermsRegistryCreatedEvent.$typeName
  readonly $fullTypeName: `${string}::terms::TermsRegistryCreatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof TermsRegistryCreatedEvent.$isPhantom =
    TermsRegistryCreatedEvent.$isPhantom

  readonly registryId: ToField<ID>
  readonly adminCapId: ToField<ID>
  readonly initialBlobId: ToField<Vector<'u8'>>

  private constructor(typeArgs: [], fields: TermsRegistryCreatedEventFields) {
    this.$fullTypeName = composeSuiType(
      TermsRegistryCreatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::terms::TermsRegistryCreatedEvent`
    this.$typeArgs = typeArgs

    this.registryId = fields.registryId
    this.adminCapId = fields.adminCapId
    this.initialBlobId = fields.initialBlobId
  }

  static reified(): TermsRegistryCreatedEventReified {
    const reifiedBcs = TermsRegistryCreatedEvent.bcs
    return {
      typeName: TermsRegistryCreatedEvent.$typeName,
      fullTypeName: composeSuiType(
        TermsRegistryCreatedEvent.$typeName,
        ...[],
      ) as `${string}::terms::TermsRegistryCreatedEvent`,
      typeArgs: [] as [],
      isPhantom: TermsRegistryCreatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => TermsRegistryCreatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        TermsRegistryCreatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => TermsRegistryCreatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TermsRegistryCreatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => TermsRegistryCreatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        TermsRegistryCreatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        TermsRegistryCreatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        TermsRegistryCreatedEvent.fetch(client, id),
      new: (fields: TermsRegistryCreatedEventFields) => {
        return new TermsRegistryCreatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TermsRegistryCreatedEventReified {
    return TermsRegistryCreatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<TermsRegistryCreatedEvent>> {
    return phantom(TermsRegistryCreatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<TermsRegistryCreatedEvent>> {
    return TermsRegistryCreatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('TermsRegistryCreatedEvent', {
      registry_id: ID.bcs,
      admin_cap_id: ID.bcs,
      initial_blob_id: bcs.vector(bcs.u8()),
    })
  }

  private static cachedBcs: ReturnType<typeof TermsRegistryCreatedEvent.instantiateBcs> | null =
    null

  static get bcs(): ReturnType<typeof TermsRegistryCreatedEvent.instantiateBcs> {
    if (!TermsRegistryCreatedEvent.cachedBcs) {
      TermsRegistryCreatedEvent.cachedBcs = TermsRegistryCreatedEvent.instantiateBcs()
    }
    return TermsRegistryCreatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): TermsRegistryCreatedEvent {
    return TermsRegistryCreatedEvent.reified().new({
      registryId: decodeFromFields(ID.reified(), fields.registry_id),
      adminCapId: decodeFromFields(ID.reified(), fields.admin_cap_id),
      initialBlobId: decodeFromFields(vector('u8'), fields.initial_blob_id),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TermsRegistryCreatedEvent {
    if (!isTermsRegistryCreatedEvent(item.type)) {
      throw new Error('not a TermsRegistryCreatedEvent type')
    }

    return TermsRegistryCreatedEvent.reified().new({
      registryId: decodeFromFieldsWithTypes(ID.reified(), item.fields.registry_id),
      adminCapId: decodeFromFieldsWithTypes(ID.reified(), item.fields.admin_cap_id),
      initialBlobId: decodeFromFieldsWithTypes(vector('u8'), item.fields.initial_blob_id),
    })
  }

  static fromBcs(data: Uint8Array): TermsRegistryCreatedEvent {
    return TermsRegistryCreatedEvent.fromFields(TermsRegistryCreatedEvent.bcs.parse(data))
  }

  toJSONField(): TermsRegistryCreatedEventJSONField {
    return {
      registryId: this.registryId,
      adminCapId: this.adminCapId,
      initialBlobId: fieldToJSON<Vector<'u8'>>(`vector<u8>`, this.initialBlobId),
    }
  }

  toJSON(): TermsRegistryCreatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): TermsRegistryCreatedEvent {
    return TermsRegistryCreatedEvent.reified().new({
      registryId: decodeFromJSONField(ID.reified(), field.registryId),
      adminCapId: decodeFromJSONField(ID.reified(), field.adminCapId),
      initialBlobId: decodeFromJSONField(vector('u8'), field.initialBlobId),
    })
  }

  static fromJSON(json: Record<string, any>): TermsRegistryCreatedEvent {
    if (json.$typeName !== TermsRegistryCreatedEvent.$typeName) {
      throw new Error(
        `not a TermsRegistryCreatedEvent json object: expected '${TermsRegistryCreatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return TermsRegistryCreatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): TermsRegistryCreatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTermsRegistryCreatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a TermsRegistryCreatedEvent object`,
      )
    }
    return TermsRegistryCreatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): TermsRegistryCreatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTermsRegistryCreatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a TermsRegistryCreatedEvent object`)
      }

      return TermsRegistryCreatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TermsRegistryCreatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<TermsRegistryCreatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isTermsRegistryCreatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a TermsRegistryCreatedEvent object`)
    }

    return TermsRegistryCreatedEvent.fromBcs(res.bcsBytes)
  }
}

/* ============================== TermsUpdatedEvent =============================== */

export function isTermsUpdatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('dca', 'terms::TermsUpdatedEvent')}::terms::TermsUpdatedEvent`
}

export interface TermsUpdatedEventFields {
  registryId: ToField<ID>
  oldVersion: ToField<'u64'>
  newVersion: ToField<'u64'>
  newBlobId: ToField<Vector<'u8'>>
  timestamp: ToField<'u64'>
}

export type TermsUpdatedEventReified = Reified<TermsUpdatedEvent, TermsUpdatedEventFields>

export type TermsUpdatedEventJSONField = {
  registryId: string
  oldVersion: string
  newVersion: string
  newBlobId: number[]
  timestamp: string
}

export type TermsUpdatedEventJSON = {
  $typeName: typeof TermsUpdatedEvent.$typeName
  $typeArgs: []
} & TermsUpdatedEventJSONField

export class TermsUpdatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::terms::TermsUpdatedEvent` = `${
    getTypeOrigin('dca', 'terms::TermsUpdatedEvent')
  }::terms::TermsUpdatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof TermsUpdatedEvent.$typeName = TermsUpdatedEvent.$typeName
  readonly $fullTypeName: `${string}::terms::TermsUpdatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof TermsUpdatedEvent.$isPhantom = TermsUpdatedEvent.$isPhantom

  readonly registryId: ToField<ID>
  readonly oldVersion: ToField<'u64'>
  readonly newVersion: ToField<'u64'>
  readonly newBlobId: ToField<Vector<'u8'>>
  readonly timestamp: ToField<'u64'>

  private constructor(typeArgs: [], fields: TermsUpdatedEventFields) {
    this.$fullTypeName = composeSuiType(
      TermsUpdatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::terms::TermsUpdatedEvent`
    this.$typeArgs = typeArgs

    this.registryId = fields.registryId
    this.oldVersion = fields.oldVersion
    this.newVersion = fields.newVersion
    this.newBlobId = fields.newBlobId
    this.timestamp = fields.timestamp
  }

  static reified(): TermsUpdatedEventReified {
    const reifiedBcs = TermsUpdatedEvent.bcs
    return {
      typeName: TermsUpdatedEvent.$typeName,
      fullTypeName: composeSuiType(
        TermsUpdatedEvent.$typeName,
        ...[],
      ) as `${string}::terms::TermsUpdatedEvent`,
      typeArgs: [] as [],
      isPhantom: TermsUpdatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => TermsUpdatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => TermsUpdatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => TermsUpdatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TermsUpdatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => TermsUpdatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => TermsUpdatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => TermsUpdatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => TermsUpdatedEvent.fetch(client, id),
      new: (fields: TermsUpdatedEventFields) => {
        return new TermsUpdatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TermsUpdatedEventReified {
    return TermsUpdatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<TermsUpdatedEvent>> {
    return phantom(TermsUpdatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<TermsUpdatedEvent>> {
    return TermsUpdatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('TermsUpdatedEvent', {
      registry_id: ID.bcs,
      old_version: bcs.u64(),
      new_version: bcs.u64(),
      new_blob_id: bcs.vector(bcs.u8()),
      timestamp: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof TermsUpdatedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof TermsUpdatedEvent.instantiateBcs> {
    if (!TermsUpdatedEvent.cachedBcs) {
      TermsUpdatedEvent.cachedBcs = TermsUpdatedEvent.instantiateBcs()
    }
    return TermsUpdatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): TermsUpdatedEvent {
    return TermsUpdatedEvent.reified().new({
      registryId: decodeFromFields(ID.reified(), fields.registry_id),
      oldVersion: decodeFromFields('u64', fields.old_version),
      newVersion: decodeFromFields('u64', fields.new_version),
      newBlobId: decodeFromFields(vector('u8'), fields.new_blob_id),
      timestamp: decodeFromFields('u64', fields.timestamp),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TermsUpdatedEvent {
    if (!isTermsUpdatedEvent(item.type)) {
      throw new Error('not a TermsUpdatedEvent type')
    }

    return TermsUpdatedEvent.reified().new({
      registryId: decodeFromFieldsWithTypes(ID.reified(), item.fields.registry_id),
      oldVersion: decodeFromFieldsWithTypes('u64', item.fields.old_version),
      newVersion: decodeFromFieldsWithTypes('u64', item.fields.new_version),
      newBlobId: decodeFromFieldsWithTypes(vector('u8'), item.fields.new_blob_id),
      timestamp: decodeFromFieldsWithTypes('u64', item.fields.timestamp),
    })
  }

  static fromBcs(data: Uint8Array): TermsUpdatedEvent {
    return TermsUpdatedEvent.fromFields(TermsUpdatedEvent.bcs.parse(data))
  }

  toJSONField(): TermsUpdatedEventJSONField {
    return {
      registryId: this.registryId,
      oldVersion: this.oldVersion.toString(),
      newVersion: this.newVersion.toString(),
      newBlobId: fieldToJSON<Vector<'u8'>>(`vector<u8>`, this.newBlobId),
      timestamp: this.timestamp.toString(),
    }
  }

  toJSON(): TermsUpdatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): TermsUpdatedEvent {
    return TermsUpdatedEvent.reified().new({
      registryId: decodeFromJSONField(ID.reified(), field.registryId),
      oldVersion: decodeFromJSONField('u64', field.oldVersion),
      newVersion: decodeFromJSONField('u64', field.newVersion),
      newBlobId: decodeFromJSONField(vector('u8'), field.newBlobId),
      timestamp: decodeFromJSONField('u64', field.timestamp),
    })
  }

  static fromJSON(json: Record<string, any>): TermsUpdatedEvent {
    if (json.$typeName !== TermsUpdatedEvent.$typeName) {
      throw new Error(
        `not a TermsUpdatedEvent json object: expected '${TermsUpdatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return TermsUpdatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): TermsUpdatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTermsUpdatedEvent(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a TermsUpdatedEvent object`)
    }
    return TermsUpdatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): TermsUpdatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTermsUpdatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a TermsUpdatedEvent object`)
      }

      return TermsUpdatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return TermsUpdatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<TermsUpdatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isTermsUpdatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a TermsUpdatedEvent object`)
    }

    return TermsUpdatedEvent.fromBcs(res.bcsBytes)
  }
}

/* ============================== MinVersionUpdatedEvent =============================== */

export function isMinVersionUpdatedEvent(type: string): boolean {
  type = compressSuiType(type)
  return type
    === `${getTypeOrigin('dca', 'terms::MinVersionUpdatedEvent')}::terms::MinVersionUpdatedEvent`
}

export interface MinVersionUpdatedEventFields {
  registryId: ToField<ID>
  oldMinVersion: ToField<'u64'>
  newMinVersion: ToField<'u64'>
}

export type MinVersionUpdatedEventReified = Reified<
  MinVersionUpdatedEvent,
  MinVersionUpdatedEventFields
>

export type MinVersionUpdatedEventJSONField = {
  registryId: string
  oldMinVersion: string
  newMinVersion: string
}

export type MinVersionUpdatedEventJSON = {
  $typeName: typeof MinVersionUpdatedEvent.$typeName
  $typeArgs: []
} & MinVersionUpdatedEventJSONField

export class MinVersionUpdatedEvent implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::terms::MinVersionUpdatedEvent` = `${
    getTypeOrigin('dca', 'terms::MinVersionUpdatedEvent')
  }::terms::MinVersionUpdatedEvent` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof MinVersionUpdatedEvent.$typeName = MinVersionUpdatedEvent.$typeName
  readonly $fullTypeName: `${string}::terms::MinVersionUpdatedEvent`
  readonly $typeArgs: []
  readonly $isPhantom: typeof MinVersionUpdatedEvent.$isPhantom = MinVersionUpdatedEvent.$isPhantom

  readonly registryId: ToField<ID>
  readonly oldMinVersion: ToField<'u64'>
  readonly newMinVersion: ToField<'u64'>

  private constructor(typeArgs: [], fields: MinVersionUpdatedEventFields) {
    this.$fullTypeName = composeSuiType(
      MinVersionUpdatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::terms::MinVersionUpdatedEvent`
    this.$typeArgs = typeArgs

    this.registryId = fields.registryId
    this.oldMinVersion = fields.oldMinVersion
    this.newMinVersion = fields.newMinVersion
  }

  static reified(): MinVersionUpdatedEventReified {
    const reifiedBcs = MinVersionUpdatedEvent.bcs
    return {
      typeName: MinVersionUpdatedEvent.$typeName,
      fullTypeName: composeSuiType(
        MinVersionUpdatedEvent.$typeName,
        ...[],
      ) as `${string}::terms::MinVersionUpdatedEvent`,
      typeArgs: [] as [],
      isPhantom: MinVersionUpdatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => MinVersionUpdatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        MinVersionUpdatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => MinVersionUpdatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => MinVersionUpdatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => MinVersionUpdatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        MinVersionUpdatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        MinVersionUpdatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        MinVersionUpdatedEvent.fetch(client, id),
      new: (fields: MinVersionUpdatedEventFields) => {
        return new MinVersionUpdatedEvent([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): MinVersionUpdatedEventReified {
    return MinVersionUpdatedEvent.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<MinVersionUpdatedEvent>> {
    return phantom(MinVersionUpdatedEvent.reified())
  }

  static get p(): PhantomReified<ToTypeStr<MinVersionUpdatedEvent>> {
    return MinVersionUpdatedEvent.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('MinVersionUpdatedEvent', {
      registry_id: ID.bcs,
      old_min_version: bcs.u64(),
      new_min_version: bcs.u64(),
    })
  }

  private static cachedBcs: ReturnType<typeof MinVersionUpdatedEvent.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof MinVersionUpdatedEvent.instantiateBcs> {
    if (!MinVersionUpdatedEvent.cachedBcs) {
      MinVersionUpdatedEvent.cachedBcs = MinVersionUpdatedEvent.instantiateBcs()
    }
    return MinVersionUpdatedEvent.cachedBcs
  }

  static fromFields(fields: Record<string, any>): MinVersionUpdatedEvent {
    return MinVersionUpdatedEvent.reified().new({
      registryId: decodeFromFields(ID.reified(), fields.registry_id),
      oldMinVersion: decodeFromFields('u64', fields.old_min_version),
      newMinVersion: decodeFromFields('u64', fields.new_min_version),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): MinVersionUpdatedEvent {
    if (!isMinVersionUpdatedEvent(item.type)) {
      throw new Error('not a MinVersionUpdatedEvent type')
    }

    return MinVersionUpdatedEvent.reified().new({
      registryId: decodeFromFieldsWithTypes(ID.reified(), item.fields.registry_id),
      oldMinVersion: decodeFromFieldsWithTypes('u64', item.fields.old_min_version),
      newMinVersion: decodeFromFieldsWithTypes('u64', item.fields.new_min_version),
    })
  }

  static fromBcs(data: Uint8Array): MinVersionUpdatedEvent {
    return MinVersionUpdatedEvent.fromFields(MinVersionUpdatedEvent.bcs.parse(data))
  }

  toJSONField(): MinVersionUpdatedEventJSONField {
    return {
      registryId: this.registryId,
      oldMinVersion: this.oldMinVersion.toString(),
      newMinVersion: this.newMinVersion.toString(),
    }
  }

  toJSON(): MinVersionUpdatedEventJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): MinVersionUpdatedEvent {
    return MinVersionUpdatedEvent.reified().new({
      registryId: decodeFromJSONField(ID.reified(), field.registryId),
      oldMinVersion: decodeFromJSONField('u64', field.oldMinVersion),
      newMinVersion: decodeFromJSONField('u64', field.newMinVersion),
    })
  }

  static fromJSON(json: Record<string, any>): MinVersionUpdatedEvent {
    if (json.$typeName !== MinVersionUpdatedEvent.$typeName) {
      throw new Error(
        `not a MinVersionUpdatedEvent json object: expected '${MinVersionUpdatedEvent.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return MinVersionUpdatedEvent.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): MinVersionUpdatedEvent {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isMinVersionUpdatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a MinVersionUpdatedEvent object`,
      )
    }
    return MinVersionUpdatedEvent.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): MinVersionUpdatedEvent {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isMinVersionUpdatedEvent(data.bcs.type)) {
        throw new Error(`object at is not a MinVersionUpdatedEvent object`)
      }

      return MinVersionUpdatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return MinVersionUpdatedEvent.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<MinVersionUpdatedEvent> {
    const res = await fetchObjectBcs(client, id)
    if (!isMinVersionUpdatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a MinVersionUpdatedEvent object`)
    }

    return MinVersionUpdatedEvent.fromBcs(res.bcsBytes)
  }
}
