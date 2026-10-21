import {expect, it} from "vitest";
import {RailDataApiSettingsSchema} from "./railDataApiSettings.dto";

it.each(["", "AbcXYZabc0123456789"])("accepts Consumer key %j", (consumerKey) => {
    expect(RailDataApiSettingsSchema.parse({consumerKey})).toEqual({consumerKey});
});

it.each(["abc-def", "abc_def", "abc:def", "abc def", " abc", "abc ", "abc\n", "é123"])(
    "rejects Consumer key %j",
    (consumerKey) => {
        expect(RailDataApiSettingsSchema.safeParse({consumerKey}).success).toBe(false);
    }
);
