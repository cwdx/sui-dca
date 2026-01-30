import * as package_ba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0 from "../_dependencies/flowx-amm/init";
import * as package_8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e from "../_dependencies/pyth/init";
import * as package_1 from "../_dependencies/std/init";
import * as package_2 from "../_dependencies/sui/init";
import * as package_5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a from "../_dependencies/wormhole/init";
import * as package_19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4 from "../dca/init";
import type { StructClassLoader } from "./loader";

export function registerClasses(loader: StructClassLoader): void {
  package_1.registerClasses(loader);
  package_2.registerClasses(loader);
  package_19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4.registerClasses(
    loader,
  );
  package_5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a.registerClasses(
    loader,
  );
  package_8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e.registerClasses(
    loader,
  );
  package_ba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0.registerClasses(
    loader,
  );
}
