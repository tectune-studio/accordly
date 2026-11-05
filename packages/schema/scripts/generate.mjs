import { readFile, writeFile } from 'node:fs/promises';
import { compile } from 'json-schema-to-typescript';
import { jsonSchemaToZod } from 'json-schema-to-zod';
const root = new URL('../', import.meta.url);
let types = '',
  code =
    "// Generated from JSON Schema. Run npm run generate -w @accordly/schema.\nimport {z} from 'zod';\n";
for (const [file, name] of [
  ['banner-config', 'BannerConfig'],
  ['consent-event', 'ConsentEvent'],
]) {
  const schema = JSON.parse(await readFile(new URL(`schemas/${file}.schema.json`, root), 'utf8'));
  const relaxed = JSON.parse(JSON.stringify(schema), (key, value) =>
    key === 'additionalProperties' && value === false ? undefined : value,
  );
  const categories = schema.properties.categories?.allOf?.map(
    (item) => item.contains.properties.id.const,
  );
  const invariant = categories
    ? `.refine(value => ${JSON.stringify(categories)}.every(id => value.categories.some(category => category.id === id)), 'Each category must be present exactly once')`
    : '';
  code += `export const ${name}Reader = ${jsonSchemaToZod(relaxed)}${invariant};\n`;
  types += await compile(schema, name);
  code += `export const ${name}Schema = ${jsonSchemaToZod(schema)}${invariant};\n`;
  types += `export declare const ${name}Schema: import('zod').ZodType<${name}>;\n`;
}

types +=
  "export declare const BannerConfigReader: import('zod').ZodType<BannerConfig>;\nexport declare const ConsentEventReader: import('zod').ZodType<ConsentEvent>;\n";
await writeFile(new URL('src/index.js', root), code);
await writeFile(new URL('src/types.d.ts', root), types);
