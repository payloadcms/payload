"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { FormEvent } from "react";
import "./index.scss";

const baseClass = "loginPage";

type Props = {
  tenantSlug: string;
};
export const Login = ({ tenantSlug }: Props) => {
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usernameRef?.current?.value || !passwordRef?.current?.value) return;
    const actionRes = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/external-users/login`,
      {
        method: "post",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: usernameRef.current.value,
          password: passwordRef.current.value,
          tenantSlug,
        }),
      }
    );
    const json = await actionRes.json();

    if (actionRes.status === 200 && json.user) {
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        router.push(redirectTo);
        return;
      } else {
        router.push(`/${routeParams.tenant}`);
      }
    } else if (actionRes.status === 400 && json?.errors?.[0]?.message) {
      window.alert(json.errors[0].message);
    } else {
      window.alert("Something went wrong, please try again.");
    }
  };

  return (
    <div className={baseClass}>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Username
            <input ref={usernameRef} type="text" name="username" />
          </label>
        </div>
        <div>
          <label>
            Password
            <input ref={passwordRef} type="password" name="password" />
          </label>
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
};
