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

/* ============================== Treasury =============================== */

export function isTreasury(type: string): boolean {
  type = compressSuiType(type)
  return type === `${getTypeOrigin('flowx-amm', 'treasury::Treasury')}::treasury::Treasury`
}

export interface TreasuryFields {
  treasurer: ToField<'address'>
}

export type TreasuryReified = Reified<Treasury, TreasuryFields>

export type TreasuryJSONField = {
  treasurer: string
}

export type TreasuryJSON = {
  $typeName: typeof Treasury.$typeName
  $typeArgs: []
} & TreasuryJSONField

export class Treasury implements StructClass {
  __StructClass = true as const

  static readonly $typeName: `${string}::treasury::Treasury` = `${
    getTypeOrigin('flowx-amm', 'treasury::Treasury')
  }::treasury::Treasury` as const
  static readonly $numTypeParams = 0
  static readonly $isPhantom = [] as const

  readonly $typeName: typeof Treasury.$typeName = Treasury.$typeName
  readonly $fullTypeName: `${string}::treasury::Treasury`
  readonly $typeArgs: []
  readonly $isPhantom: typeof Treasury.$isPhantom = Treasury.$isPhantom

  readonly treasurer: ToField<'address'>

  private constructor(typeArgs: [], fields: TreasuryFields) {
    this.$fullTypeName = composeSuiType(
      Treasury.$typeName,
      ...typeArgs,
    ) as `${string}::treasury::Treasury`
    this.$typeArgs = typeArgs

    this.treasurer = fields.treasurer
  }

  static reified(): TreasuryReified {
    const reifiedBcs = Treasury.bcs
    return {
      typeName: Treasury.$typeName,
      fullTypeName: composeSuiType(
        Treasury.$typeName,
        ...[],
      ) as `${string}::treasury::Treasury`,
      typeArgs: [] as [],
      isPhantom: Treasury.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => Treasury.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) => Treasury.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => Treasury.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => Treasury.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => Treasury.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) => Treasury.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) => Treasury.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) => Treasury.fetch(client, id),
      new: (fields: TreasuryFields) => {
        return new Treasury([], fields)
      },
      kind: 'StructClassReified',
    }
  }

  static get r(): TreasuryReified {
    return Treasury.reified()
  }

  static phantom(): PhantomReified<ToTypeStr<Treasury>> {
    return phantom(Treasury.reified())
  }

  static get p(): PhantomReified<ToTypeStr<Treasury>> {
    return Treasury.phantom()
  }

  private static instantiateBcs() {
    return bcs.struct('Treasury', {
      treasurer: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    })
  }

  private static cachedBcs: ReturnType<typeof Treasury.instantiateBcs> | null = null

  static get bcs(): ReturnType<typeof Treasury.instantiateBcs> {
    if (!Treasury.cachedBcs) {
      Treasury.cachedBcs = Treasury.instantiateBcs()
    }
    return Treasury.cachedBcs
  }

  static fromFields(fields: Record<string, any>): Treasury {
    return Treasury.reified().new({
      treasurer: decodeFromFields('address', fields.treasurer),
    })
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): Treasury {
    if (!isTreasury(item.type)) {
      throw new Error('not a Treasury type')
    }

    return Treasury.reified().new({
      treasurer: decodeFromFieldsWithTypes('address', item.fields.treasurer),
    })
  }

  static fromBcs(data: Uint8Array): Treasury {
    return Treasury.fromFields(Treasury.bcs.parse(data))
  }

  toJSONField(): TreasuryJSONField {
    return {
      treasurer: this.treasurer,
    }
  }

  toJSON(): TreasuryJSON {
    return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() }
  }

  static fromJSONField(field: any): Treasury {
    return Treasury.reified().new({
      treasurer: decodeFromJSONField('address', field.treasurer),
    })
  }

  static fromJSON(json: Record<string, any>): Treasury {
    if (json.$typeName !== Treasury.$typeName) {
      throw new Error(
        `not a Treasury json object: expected '${Treasury.$typeName}' but got '${json.$typeName}'`,
      )
    }

    return Treasury.fromJSONField(json)
  }

  static fromSuiParsedData(content: SuiParsedData): Treasury {
    if (content.dataType !== 'moveObject') {
      throw new Error('not an object')
    }
    if (!isTreasury(content.type)) {
      throw new Error(`object at ${(content.fields as any).id} is not a Treasury object`)
    }
    return Treasury.fromFieldsWithTypes(content)
  }

  static fromSuiObjectData(data: SuiObjectData): Treasury {
    if (data.bcs) {
      if (data.bcs.dataType !== 'moveObject' || !isTreasury(data.bcs.type)) {
        throw new Error(`object at is not a Treasury object`)
      }

      return Treasury.fromBcs(fromBase64(data.bcs.bcsBytes))
    }
    if (data.content) {
      return Treasury.fromSuiParsedData(data.content)
    }
    throw new Error(
      'Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.',
    )
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<Treasury> {
    const res = await fetchObjectBcs(client, id)
    if (!isTreasury(res.type)) {
      throw new Error(`object at id ${id} is not a Treasury object`)
    }

    return Treasury.fromBcs(res.bcsBytes)
  }
}
