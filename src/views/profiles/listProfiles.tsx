import { useEffect, useMemo, useState } from "react";
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    TableContainer,
    CircularProgress,
    Alert,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import config from "src/config/config";

interface Profile {
    id_profile: number;
    nameprofile: string; 
    nameProfile?: string; 
    description: string;
    permissions: string[] | string | null;
    statusprofile?: number;
    statusProfile?: number;
}

interface SystemUser {
    id_userSystem: number;
    first_name: string;
    last_name: string;
    emailLog: string;
    passLog: string;
    contry: string;
    systemProfile: number;
    userStatus: number;
}

const ListProfile = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<SystemUser[]>([]);

    // Modal de edición
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) {
                    setError("No token found. Please login again.");
                    setLoading(false);
                    return;
                }

                const myHeaders = new Headers();
                myHeaders.append("authToken", token);
                myHeaders.append("Content-Type", "application/json");

                // Fetch perfiles y usuarios en paralelo
                const [resProfiles, resUsers] = await Promise.all([
                    fetch(`${config.rutaApi}show_list_profiles`, { method: "GET", headers: myHeaders }),
                    fetch(`${config.rutaApi}users_system_list`, { method: "GET", headers: myHeaders }),
                ]);

                if (!resProfiles.ok) {
                    const txt = await resProfiles.text();
                    throw new Error(`Profiles HTTP ${resProfiles.status} - ${txt}`);
                }
                if (!resUsers.ok) {
                    const txt = await resUsers.text();
                    throw new Error(`Users HTTP ${resUsers.status} - ${txt}`);
                }

                const dataProfiles = await resProfiles.json();
                const dataUsers = await resUsers.json();

                if (Array.isArray(dataProfiles)) {
                    const normalized: Profile[] = dataProfiles.map((p: any) => ({
                        ...p,
                        permissions: Array.isArray(p.permissions)
                            ? p.permissions
                            : typeof p.permissions === "string"
                            ? p.permissions.replace(/[{}]/g, "").split(/\s*,\s*/).filter(Boolean)
                            : [],
                    }));
                    setProfiles(normalized);
                } else if (dataProfiles?.error) {
                    setError(dataProfiles.error);
                } else {
                    setError("Unexpected profiles response structure");
                }

                // dataUsers puede venir como { dataUsers: [...] }
                const usersArr: SystemUser[] = Array.isArray(dataUsers)
                    ? dataUsers as SystemUser[]
                    : Array.isArray(dataUsers?.dataUsers)
                        ? (dataUsers.dataUsers as SystemUser[])
                        : [];
                setUsers(usersArr);
            } catch (e: any) {
                console.error("Error fetching profiles:", e);
                setError(e.message || "Error fetching profiles");
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    // Mapa de usuarios por perfil (systemProfile -> usuarios[])
    const usersByProfile = useMemo(() => {
        const map = new Map<number, SystemUser[]>();
        for (const u of users) {
            const key = Number(u.systemProfile) || 0;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(u);
        }
        return map;
    }, [users]);

    // Union de permisos existentes para pintar checkboxes en modal
    const allPermissions = useMemo(() => {
        const set = new Set<string>();
        for (const p of profiles) {
            const perms = Array.isArray(p.permissions) ? p.permissions : [];
            perms.forEach((perm) => set.add(perm));
        }
        return Array.from(set).sort();
    }, [profiles]);

    const openEditModal = (p: Profile) => {
        setSelectedProfile(p);
        setSelectedPerms(Array.isArray(p.permissions) ? p.permissions : []);
        setOpenEdit(true);
    };

    const closeEditModal = () => {
        setOpenEdit(false);
        setSelectedProfile(null);
        setSelectedPerms([]);
    };

    const togglePerm = (perm: string) => {
        setSelectedPerms((prev) =>
            prev.includes(perm) ? prev.filter((x) => x !== perm) : [...prev, perm]
        );
    };

    return (
        <BaseCard title="Profiles">
            {loading && (
                <Box py={4} display="flex" justifyContent="center">
                    <CircularProgress size={40} />
                </Box>
            )}
            {error && !loading && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {!loading && !error && (
                <>
                    <TableContainer>
                        <Table size="small" aria-label="profiles table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Permissions</TableCell>
                                    <TableCell>Users</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Edit</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {profiles.map((p) => {
                                    const name = p.nameProfile || p.nameprofile || "(No name)";
                                    const perms = Array.isArray(p.permissions) ? p.permissions : [];
                                    const status = p.statusProfile ?? p.statusprofile;
                                    const ulist = usersByProfile.get(Number(p.id_profile)) || [];
                                    const permsSet = new Set(perms.map((x) => String(x).toLowerCase()));
                                    const universe = new Set(allPermissions.map((x) => String(x).toLowerCase()));
                                    const isAll = universe.size > 0 && Array.from(universe).every((x) => permsSet.has(x));
                                    return (
                                        <TableRow key={p.id_profile} hover>
                                            <TableCell>{p.id_profile}</TableCell>
                                            <TableCell>{name}</TableCell>
                                            <TableCell>{p.description}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {isAll ? (
                                                        <Chip label="All" size="small" sx={{ backgroundColor: '#0D4B3B', color: '#fff' }} />
                                                    ) : (
                                                        perms.map((perm) => (
                                                            <Chip
                                                                key={perm}
                                                                label={perm}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ borderColor: '#0D4B3B', color: '#0D4B3B' }}
                                                            />
                                                        ))
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={String(ulist.length)} size="small" sx={{ borderColor: '#0D4B3B', color: '#0D4B3B' }} variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={status === 1 ? "Active" : "Inactive"}
                                                    size="small"
                                                    sx={status === 1 ? { backgroundColor: '#0D4B3B', color: '#fff' } : undefined}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ borderColor: '#0D4B3B', color: '#0D4B3B' }}
                                                    onClick={() => openEditModal(p)}
                                                >
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Modal de Edición de Perfil */}
                    <Dialog open={openEdit} onClose={closeEditModal} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ color: '#0D4B3B' }}>Edit Profile</DialogTitle>
                        <DialogContent dividers>
                            {selectedProfile && (
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {selectedProfile.nameProfile || selectedProfile.nameprofile}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {selectedProfile.description}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#0D4B3B' }}>Permissions</Typography>
                                    {allPermissions.length === 0 ? (
                                        <Typography variant="body2">No permissions available.</Typography>
                                    ) : (
                                        <FormGroup>
                                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                                {allPermissions.map((perm) => (
                                                    <FormControlLabel
                                                        key={perm}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedPerms.includes(perm)}
                                                                onChange={() => togglePerm(perm)}
                                                                sx={{
                                                                    color: '#0D4B3B',
                                                                    '&.Mui-checked': { color: '#0D4B3B' },
                                                                }}
                                                            />
                                                        }
                                                        label={<Chip label={perm} size="small" variant="outlined" sx={{ borderColor: '#0D4B3B', color: '#0D4B3B' }} />}
                                                    />
                                                ))}
                                            </Stack>
                                        </FormGroup>
                                    )}

                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#0D4B3B' }}>Users with this profile</Typography>
                                    <Stack spacing={0.5}>
                                        {(usersByProfile.get(Number(selectedProfile.id_profile)) || []).map((u) => (
                                            <Typography key={u.id_userSystem} variant="body2">
                                                {u.first_name} {u.last_name}
                                            </Typography>
                                        ))}
                                        {(usersByProfile.get(Number(selectedProfile.id_profile)) || []).length === 0 && (
                                            <Typography variant="body2">No users assigned.</Typography>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={closeEditModal} sx={{ color: '#0D4B3B', '&:hover': { backgroundColor: '#D9EDE3' } }}>Close</Button>
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: '#0D4B3B', '&:hover': { backgroundColor: '#093828' } }}
                                onClick={() => {
                                    // Aquí iría la llamada al backend para actualizar permisos del perfil
                                    console.log('Saving permissions for profile', selectedProfile?.id_profile, selectedPerms);
                                    closeEditModal();
                                }}
                            >
                                Save
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </BaseCard>
    );
};

export default ListProfile;