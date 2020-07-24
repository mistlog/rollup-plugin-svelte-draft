import { createFilter } from 'rollup-pluginutils';
import { TranscribeTypeDraftAsync, TranscribeSvelteDraftAsync, ISvelteDraftConfig } from 'svelte-draft/dist/cli/literator';
import { resolve as resolvePath } from 'path';
import { exists } from 'fs';
import { promisify } from 'util';

export interface IOptions {
    include?: Array<string>;
    exclude?: Array<string>;
    config?: ISvelteDraftConfig;
}

export default function SvelteDraft(options: IOptions = {}) {
    const filter = createFilter(options.include, options.exclude);
    const ExistsAsync = promisify(exists);

    return {
        async resolveId(importee: string, importer: string) {
            // importer of entry main.js is undefined, skip it
            if (!importer) return null;

            // console.log(`importee: ${importee}, importer: ${importer}`);

            const importee_absolute_path = resolvePath(importer, "..", importee);

            // importee is typedraft: *.js.tsx
            if (importee.endsWith(".js") && await ExistsAsync(`${importee_absolute_path}.tsx`)) {
                return `${importee_absolute_path}.tsx`;
            }
            // importee is svelte-draft: *.tsx
            else if (await ExistsAsync(`${importee_absolute_path}.tsx`)) {
                return `${importee_absolute_path}.tsx`;
            }
            // importee is just typescript: *.ts
            else if (await ExistsAsync(`${importee_absolute_path}.ts`)) {
                return `${importee_absolute_path}.ts`;
            }
            return null;
        },

        async transform(code: string, id: string) {
            if (!filter(id)) return;

            let transformed = "";
            const { config } = options;

            // console.log(`id: ${id}`);

            // it's typedraft or typescript file
            if (id.endsWith(".js.tsx") || id.endsWith(".ts")) {
                transformed = await TranscribeTypeDraftAsync(id, config);
            }
            // it's svelte-draft
            else if (id.endsWith(".tsx")) {
                transformed = await TranscribeSvelteDraftAsync(id, config);
                const css_path = id.replace(".tsx", ".css");
                if (await ExistsAsync(css_path)) {
                    this.addWatchFile(css_path);
                }
            }

            return {
                code: transformed,
                map: null
            };
        }
    };
}