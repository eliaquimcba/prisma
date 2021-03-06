import Renderer from './renderer'
import RelationalParser from '../parser/relationalParser'
import { ISDL, IGQLType, IDirectiveInfo, IGQLField } from '../model'
import GQLAssert from '../../util/gqlAssert'
import { TypeIdentifiers } from '../scalar'
import { DirectiveKeys } from '../directives'
/**
 * Renderer implementation for relational models.
 */
export default class RelationalRenderer extends Renderer {
  // Special case for postgres. We never render id, createdAt, isCreatedAt directive.
  protected shouldCreateIsIdFieldDirective(field: IGQLField) {
    return false
  }

  protected shouldCreateCreatedAtFieldDirective(field: IGQLField) {
    return false
  }

  protected shouldCreateUpdatedAtFieldDirective(field: IGQLField) {
    return false
  }

  protected shouldCreateIsUniqueFieldDirective(field: IGQLField) {
    return field.isUnique || field.isId
  }

  // Avoid embedded types
  protected renderType(type: IGQLType): string {
    if (type.isEmbedded) {
      GQLAssert.raise('Embedded types are not supported in relational models.')
    }

    return super.renderType(type)
  }

  // Use PG specific table/column refs
  protected createDatabaseNameTypeDirective(type: IGQLType) {
    return {
      name: 'pgTable',
      arguments: {
        name: this.renderValue(TypeIdentifiers.string, type.databaseName),
      },
    }
  }

  protected createDatabaseNameFieldDirective(field: IGQLField) {
    return {
      name: 'pgColumn',
      arguments: {
        name: this.renderValue(TypeIdentifiers.string, field.databaseName),
      },
    }
  }

  // Assert some basic rules
  protected renderField(field: IGQLField): string {
    if (field.isId && field.name !== RelationalParser.idFieldName) {
      field.comments.push({
        text: `ID field must be called "${
          RelationalParser.idFieldName
        }" in relational models.`,
        isError: true,
      })
    }
    if (
      field.isCreatedAt &&
      field.name !== RelationalParser.createdAtFieldName
    ) {
      field.comments.push({
        text: `CreatedAt field must be called "${
          RelationalParser.createdAtFieldName
        }" in relational models.`,
        isError: true,
      })
    }
    if (
      field.isUpdatedAt &&
      field.name !== RelationalParser.updatedAtFieldName
    ) {
      field.comments.push({
        text: `UpdatedAt field must be called "${
          RelationalParser.updatedAtFieldName
        }" in relational models.`,
        isError: true,
      })
    }

    return super.renderField(field)
  }

  // Remove @relation(link: TABLE) directive.
  protected renderDirectives(directives: IDirectiveInfo[]) {
    return super.renderDirectives(
      directives.filter(
        dir =>
          dir.name !== DirectiveKeys.relation || dir.arguments.link !== 'TABLE',
      ),
    )
  }
}
