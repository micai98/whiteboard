"use server"
import { cookies } from "next/headers";

export async function setUserName(name: string) {
    cookies().set("user_name", name);

    return {message: "ok"};
}

export async function getUserName() {
    return cookies().get("user_name")?.value;
}