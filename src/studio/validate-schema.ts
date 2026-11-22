import studioSchema from './schema/fleedfolio-studio-v1.schema.json'

type JsonSchema = Record<string, unknown>
const root = studioSchema as unknown as JsonSchema
const definitions = root.$defs as Record<string, JsonSchema>
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Small, intentionally limited validator for the keywords used by Studio v1.
 * This is not a general JSON Schema implementation. It ensures our shipped
 * JSON Schema is actually enforced without an additional runtime dependency.
 */
export function validateStudioShape(value: unknown): string[] {
  const issues: string[] = []
  const visit = (input: unknown, schema: JsonSchema, path: string, depth: number, output: string[]): void => {
    if (depth > 24 || output.length > 24) { output.push(path + ': schema depth/issue limit'); return }
    if (typeof schema.$ref === 'string') {
      const match = /^#\/\$defs\/([a-zA-Z][a-zA-Z0-9]*)$/.exec(schema.$ref)
      const definition = match ? definitions[match[1]] : undefined
      if (!definition) { output.push(path + ': unresolved schema definition'); return }
      visit(input, definition, path, depth + 1, output)
      return
    }
    if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
      const options = (schema.oneOf ?? schema.anyOf) as JsonSchema[]
      const valid = options.filter(option => {
        const candidate: string[] = []
        visit(input, option, path, depth + 1, candidate)
        return candidate.length === 0
      })
      if ((schema.oneOf && valid.length !== 1) || (schema.anyOf && valid.length < 1)) output.push(path + ': no matching schema variant')
      return
    }
    if (schema.const !== undefined && input !== schema.const) { output.push(path + ': expected constant'); return }
    if (Array.isArray(schema.enum) && !schema.enum.includes(input)) { output.push(path + ': invalid enum value'); return }
    if (schema.type === 'object') {
      if (!isObject(input)) { output.push(path + ': expected object'); return }
      const properties = isObject(schema.properties) ? schema.properties as Record<string, JsonSchema> : {}
      const required = Array.isArray(schema.required) ? schema.required as string[] : []
      for (const key of required) if (!Object.prototype.hasOwnProperty.call(input, key)) output.push(path + '.' + key + ': required')
      if (schema.additionalProperties === false) for (const key of Object.keys(input)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) output.push(path + '.' + key + ': unknown field')
      }
      for (const [key, subschema] of Object.entries(properties)) {
        if (Object.prototype.hasOwnProperty.call(input, key)) visit(input[key], subschema, path + '.' + key, depth + 1, output)
        if (output.length > 24) return
      }
      return
    }
    if (schema.type === 'array') {
      if (!Array.isArray(input)) { output.push(path + ': expected array'); return }
      if (typeof schema.minItems === 'number' && input.length < schema.minItems) output.push(path + ': too few items')
      if (typeof schema.maxItems === 'number' && input.length > schema.maxItems) output.push(path + ': too many items')
      if (isObject(schema.items)) input.forEach((item, index) => {
        if (index < 250 && output.length <= 24) visit(item, schema.items as JsonSchema, path + '[' + index + ']', depth + 1, output)
      })
      return
    }
    if (schema.type === 'string') {
      if (typeof input !== 'string') { output.push(path + ': expected text'); return }
      if (typeof schema.minLength === 'number' && input.length < schema.minLength) output.push(path + ': too short')
      if (typeof schema.maxLength === 'number' && input.length > schema.maxLength) output.push(path + ': too long')
      if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(input)) output.push(path + ': invalid characters')
      return
    }
    if (schema.type === 'integer') {
      if (!Number.isInteger(input)) { output.push(path + ': expected integer'); return }
      if (typeof schema.minimum === 'number' && (input as number) < schema.minimum) output.push(path + ': below minimum')
      if (typeof schema.maximum === 'number' && (input as number) > schema.maximum) output.push(path + ': above maximum')
      return
    }
    if (schema.type === 'null' && input !== null) output.push(path + ': expected null')
  }
  visit(value, root, '$', 0, issues)
  return issues.slice(0, 25)
}
