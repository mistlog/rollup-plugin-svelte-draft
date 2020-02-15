import { createFilter } from 'rollup-pluginutils';
import { TranscribeTypeDraftAsync, TranscribeSvelteDraftAsync } from 'svelte-draft/dist/cli/literator';
import { resolve as resolvePath } from 'path';
import { exists } from 'fs';
import { promisify } from 'util';

export interface IOptions
{
    include?: Array<string>;
    exclude?: Array<string>;
}

export default function SvelteDraft(options: IOptions = {})
{
    const filter = createFilter(options.include, options.exclude);

    return {
        async resolveId(importee: string, importer: string)
        {
            // importer of entry main.js is undefined, skip it
            if (!importer) return null;

            //
            if (importee.endsWith(".svelte") || importee.endsWith(".js"))
            {
                return `${resolvePath(importer, "..", importee)}.tsx`;
            }
            return null;
        },

        async transform(code: string, id: string)
        {
            if (!filter(id)) return;

            let transformed = "";
            if (id.endsWith(".svelte.tsx"))
            {
                transformed = await TranscribeSvelteDraftAsync(id);
                const css_path = id.replace(".svelte.tsx", ".css");
                if (await promisify(exists)(css_path))
                {
                    this.addWatchFile(css_path);
                }
            }
            else if (id.endsWith(".js.tsx"))
            {
                transformed = await TranscribeTypeDraftAsync(id);
            }

            return {
                code: transformed,
                map: null
            };
        }
    };
}